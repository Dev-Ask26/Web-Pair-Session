const express = require('express');
const fs = require('fs-extra');
const { exec } = require("child_process");
const router = express.Router();
const pino = require("pino");
const { Boom } = require("@hapi/boom");
const crypto = require('crypto');
const chalk = require("chalk");
const FileType = require('file-type');
const fetch = require('node-fetch');
const moment = require('moment-timezone');
const readline = require('readline');
const os = require('os');
const path = require('path');

const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require('./database/bilal-xd');
const {smsg, fetchJson, await: awaitfunc, sleep } = require('./database/mylib');

const {
    default: makeWASocket,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    Browsers,
    DisconnectReason,
    downloadContentFromMessage,
    jidDecode
} = require("@whiskeysockets/baileys");

// Variables globales pour le tracking
const reconnectAttempts = {};
const badSessionRetries = {};
const pairingRequested = {};
const activeSockets = {};
const store = {
    contacts: {}
};

// Fonction pour supprimer un dossier récursivement
function deleteFolderRecursive(folderPath) {
    if (fs.existsSync(folderPath)) {
        fs.rmSync(folderPath, { recursive: true, force: true });
        console.log(`Deleted session folder: ${folderPath}`);
    }
}

// Fonction pour obtenir un buffer
async function getBuffer(url) {
    try {
        const response = await fetch(url);
        return await response.buffer();
    } catch (error) {
        console.error('Error getting buffer:', error);
        return Buffer.alloc(0);
    }
}

router.get('/', async (req, res) => {
    let num = req.query.number;
    
    if (!num) {
        return res.status(400).send({ error: "Number parameter is required" });
    }

    // Nettoyer le numéro
    num = num.replace(/[^0-9]/g, '');
    const sessionPath = `./session_${num}`;

    async function BILALXD(DevNotBot) {
        // Empêcher les instances multiples pour le même numéro
        if (activeSockets[DevNotBot]) {
            console.log(chalk.yellow(`[${DevNotBot}] Socket already active, skipping...`));
            return;
        }

        activeSockets[DevNotBot] = true;
        let devaskNotBot = null;
        let keepAliveInterval = null;

        try {
            const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

            devaskNotBot = makeWASocket({
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
                },
                printQRInTerminal: false,
                logger: pino({ level: "error" }).child({ level: "error" }),
                browser: Browsers.macOS("Safari"),
                markOnlineOnConnect: false,
                retryRequestDelayMs: 1000,
                maxMsgRetryCount: 3,
                connectTimeoutMs: 60000,
                keepAliveIntervalMs: 30000
            });

            // Sauvegarder les crédentials
            devaskNotBot.ev.on('creds.update', saveCreds);

            if (!devaskNotBot.authState.creds.registered) {
                await delay(2000);
                const code = await devaskNotBot.requestPairingCode(DevNotBot);
                console.log(chalk.blue(`[${DevNotBot}] Pairing code: ${code}`));
                if (!res.headersSent) {
                    res.send({ code, number: DevNotBot });
                }
                pairingRequested[DevNotBot] = true;
            }

            devaskNotBot.decodeJid = (jid) => {
                if (!jid) return jid;
                if (/:\d+@/gi.test(jid)) {
                    const decode = jidDecode(jid) || {};
                    return decode.user && decode.server && `${decode.user}@${decode.server}` || jid;
                }
                return jid;
            };

            devaskNotBot.ev.on("messages.upsert", async chatUpdate => {
                try {
                    const msg = chatUpdate.messages[0];
                    if (!msg.message || msg.key.remoteJid === 'status@broadcast') return;
                    const m = smsg(devaskNotBot, msg, store);
                    require("./handler")(devaskNotBot, m, chatUpdate, store);
                } catch (err) {
                    console.error(`[${DevNotBot}] Message processing error:`, err.stack || err.message);
                }
            });

            // Keep-alive interval
            keepAliveInterval = setInterval(() => {
                if (devaskNotBot && devaskNotBot.connection === 'open') {
                    try {
                        devaskNotBot.sendPresenceUpdate('available');
                    } catch (error) {
                        console.error(`[${DevNotBot}] Keep-alive error:`, error.message);
                    }
                }
            }, 30000);

            devaskNotBot.ev.on("connection.update", async update => {
                const { connection, lastDisconnect, qr } = update;
                const statusCode = lastDisconnect?.error?.output?.statusCode;

                console.log(chalk.cyan(`[${DevNotBot}] Connection update: ${connection}, status: ${statusCode}`));

                try {
                    if (connection === "close") {
                        if (keepAliveInterval) {
                            clearInterval(keepAliveInterval);
                            keepAliveInterval = null;
                        }

                        const shouldReconnect = 
                            statusCode === DisconnectReason.connectionClosed ||
                            statusCode === DisconnectReason.connectionLost ||
                            statusCode === DisconnectReason.restartRequired ||
                            statusCode === DisconnectReason.timedOut;

                        if (statusCode === DisconnectReason.badSession) {
                            badSessionRetries[DevNotBot] = (badSessionRetries[DevNotBot] || 0) + 1;

                            if (badSessionRetries[DevNotBot] <= 3) {
                                console.log(chalk.yellow(`[${DevNotBot}] Bad session detected. Retrying (${badSessionRetries[DevNotBot]}/3) in 5s...`));
                                return setTimeout(() => {
                                    activeSockets[DevNotBot] = false;
                                    BILALXD(DevNotBot);
                                }, 5000);
                            } else {
                                console.log(chalk.red(`[${DevNotBot}] Maximum bad session attempts reached. Deleting session...`));
                                deleteFolderRecursive(sessionPath);
                                badSessionRetries[DevNotBot] = 0;
                                return setTimeout(() => {
                                    activeSockets[DevNotBot] = false;
                                    BILALXD(DevNotBot);
                                }, 10000);
                            }
                        }
                        else if (statusCode === DisconnectReason.loggedOut) {
                            console.log(chalk.red(`[${DevNotBot}] Logged out. Deleting session...`));
                            deleteFolderRecursive(sessionPath);
                            activeSockets[DevNotBot] = false;
                            return;
                        }
                        else if (shouldReconnect) {
                            reconnectAttempts[DevNotBot] = (reconnectAttempts[DevNotBot] || 0) + 1;
                            
                            if (reconnectAttempts[DevNotBot] <= 5) {
                                const delayTime = reconnectAttempts[DevNotBot] * 2000;
                                console.log(chalk.yellow(`[${DevNotBot}] Reconnecting (${reconnectAttempts[DevNotBot]}/5) in ${delayTime}ms...`));
                                return setTimeout(() => {
                                    activeSockets[DevNotBot] = false;
                                    BILALXD(DevNotBot);
                                }, delayTime);
                            } else {
                                console.log(chalk.red(`[${DevNotBot}] Maximum reconnection attempts reached. Waiting 30s...`));
                                reconnectAttempts[DevNotBot] = 0;
                                return setTimeout(() => {
                                    activeSockets[DevNotBot] = false;
                                    BILALXD(DevNotBot);
                                }, 30000);
                            }
                        }

                    } else if (connection === "open") {
                        console.log(chalk.green(`[${DevNotBot}] Connected successfully!`));
                        
                        reconnectAttempts[DevNotBot] = 0;
                        badSessionRetries[DevNotBot] = 0;
                        
                        try {
                            if (devaskNotBot.newsletterFollow) {
                                devaskNotBot.newsletterFollow("120363296818107681@newsletter");                    
                                devaskNotBot.newsletterFollow("120363401251267400@newsletter");
                            }
                            
                            await devaskNotBot.sendMessage(devaskNotBot.user.id, {
                                image: { url: 'https://i.ibb.co/qYG993MS/72a4e407f204.jpg' },
                                caption: `
█▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀█
█░░╦─╦╔╗╦─╔╗╔╗╔╦╗╔╗░░█
█░░║║║╠─║─║─║║║║║╠─░░█
█░░╚╩╝╚╝╚╝╚╝╚╝╩─╩╚╝░░█
█▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄█

█▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀█
█ 𝐁𝐈𝐋𝐀𝐋 𝐁𝐔𝐆 𝐗𝐃               
█ 𝐁𝐘 𝐁𝐈𝐋𝐄𝐋 𝐊𝐈𝐍𝐆            
█ 𝐕𝐄𝐑𝐒𝐈𝐎𝐍 1.0.0               
█ 𝐏𝐑𝐄𝐅𝐈𝐗: *${global.prefix}*                  
█ 𝐎𝐖𝐍𝐄𝐑: *${global.owner}*
█ 𝐌𝐎𝐃𝐄: *${global.mode}*
█ 𝐂𝐌𝐃: 𝐮𝐬𝐞 .𝐦𝐞𝐧𝐮
█▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄█
`
                        });                 

                        } catch (err) {
                            console.error(`[${DevNotBot}] Initialization error:`, err.stack || err.message);
                        }
                    }
                } catch (err) {
                    console.error(`[${DevNotBot}] Connection update error:`, err.stack || err.message);
                    setTimeout(() => {
                        activeSockets[DevNotBot] = false;
                        BILALXD(DevNotBot);
                    }, 10000);
                }
            });     

            devaskNotBot.sendImageAsSticker = async (jid, path, quoted, options = {}) => {
                let buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0);
                let buffer = options && (options.packname || options.author) ? await writeExifImg(buff, options) : await imageToWebp(buff);
                await devaskNotBot.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted });
                return buffer;
            };

            devaskNotBot.sendVideoAsSticker = async (jid, path, quoted, options = {}) => {
                let buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0);
                let buffer = options && (options.packname || options.author) ? await writeExifVid(buff, options) : await videoToWebp(buff);
                await devaskNotBot.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted });
                return buffer;
            };

            devaskNotBot.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
                let quoted = message.msg ? message.msg : message;
                let mime = (message.msg || message).mimetype || '';
                let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0];
                const stream = await downloadContentFromMessage(quoted, messageType);
                let buffer = Buffer.from([]);
                for await (const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk]);
                }
                let type = await FileType.fromBuffer(buffer);
                let trueFileName = attachExtension ? (filename + '.' + type.ext) : filename;
                await fs.writeFileSync(trueFileName, buffer);
                return trueFileName;
            };

            devaskNotBot.sendTextWithMentions = async (jid, text, quoted, options = {}) => devaskNotBot.sendMessage(jid, { text: text, mentions: [...text.matchAll(/@(\d{0,16})/g)].map(v => v[1] + '@s.whatsapp.net'), ...options }, { quoted });

            devaskNotBot.downloadMediaMessage = async (message) => {
                let mime = (message.msg || message).mimetype || '';
                let messageType = message.mtype 
                    ? message.mtype.replace(/Message/gi, '') 
                    : mime.split('/')[0];

                const stream = await downloadContentFromMessage(message, messageType);
                let buffer = Buffer.from([]);

                for await (const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk]);
                }

                return buffer;
            };      

            devaskNotBot.sendText = (jid, text, quoted = '', options) => devaskNotBot.sendMessage(jid, { text: text, ...options }, { quoted });

            devaskNotBot.ev.on('contacts.update', update => {
                for (let contact of update) {
                    let id = devaskNotBot.decodeJid(contact.id);
                    if (store && store.contacts) {
                        store.contacts[id] = { id, name: contact.notify };
                    }
                }
            });

        } catch (error) {
            console.error(`[${DevNotBot}] Initialization error:`, error.stack || error.message);
            activeSockets[DevNotBot] = false;
            
            setTimeout(() => {
                BILALXD(DevNotBot);
            }, 10000);
        }
    }

    BILALXD(num);
});

module.exports = router;

let file = require.resolve(__filename);
fs.watchFile(file, () => {
    fs.unwatchFile(file);
    console.log(chalk.redBright(`Update detected in '${__filename}'`));
    delete require.cache[file];
    require(file);
});