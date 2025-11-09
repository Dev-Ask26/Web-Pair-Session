const express = require('express');
const fs = require('fs-extra');
const { exec } = require("child_process");
const router = express.Router();
const pino = require("pino");
require('./config')
const { Boom } = require("@hapi/boom");
const crypto = require('crypto');
const chalk = require("chalk");
const FileType = require('file-type');
const fetch = require('node-fetch');
const moment = require('moment-timezone');
const readline = require('readline');
const os = require('os');

const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require('./database/bilal-xd');

const {smsg, fetchJson, await: awaitfunc, sleep } = require('./database/mylib');

const {
    default: makeWASocket,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    Browsers,
    DisconnectReason
} = require("@whiskeysockets/baileys");

router.get('/', async (req, res) => {
    let num = req.query.number;

    async function BILALXD(DevNotBot) {
        const { state, saveCreds } = await useMultiFileAuthState(`./session`);

        try {
            const devaskNotBot = makeWASocket({
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
                },
                printQRInTerminal: false,
                logger: pino({ level: "fatal" }).child({ level: "fatal" }),
                browser: Browsers.macOS("Safari"),
                // Options ajoutées pour améliorer la connexion
                connectTimeoutMs: 60000,
                keepAliveIntervalMs: 25000,
            });

            // Sauvegarder les credentials
            devaskNotBot.ev.on('creds.update', saveCreds);

            if (!devaskNotBot.authState.creds.registered) {
                await delay(1000);
                num = num.replace(/[^0-9]/g, '');
                
                // Formater le numéro correctement
                if (!num.startsWith('+')) {
                    num = '+' + num;
                }
                
                console.log(chalk.blue(`Requesting pairing code for: ${num}`));
                const code = await devaskNotBot.requestPairingCode(num);
                console.log(chalk.green(`Pairing code: ${code}`));
                
                if (!res.headersSent) {
                    await res.send({ 
                        code: code,
                        number: num
                    });
                }
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
                    console.error("Message processing error:", err.stack || err.message);
                }
            });

            const badSessionRetries = {};
            const reconnectAttempts = {};
            const pairingRequested = {};

            devaskNotBot.ev.on("connection.update", async update => {
                const { connection, lastDisconnect } = update;
                const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;

                try {
                    if (connection === "close") {
                        switch (statusCode) {
                            case DisconnectReason.badSession:
                                badSessionRetries[DevNotBot] = (badSessionRetries[DevNotBot] || 0) + 1;

                                if (badSessionRetries[DevNotBot] <= 6) {
                                    console.log(chalk.yellow(`[${DevNotBot}] Bad session detected. Retrying (${badSessionRetries[DevNotBot]}/6)...`));
                                    pairingRequested[DevNotBot] = false;
                                    return setTimeout(() => BILALXD(DevNotBot), 3000);
                                } else {
                                    console.log(chalk.red(`[${DevNotBot}] Maximum attempts reached. Deleting session...`));
                                    try {
                                        await fs.remove('./session');
                                    } catch (e) {}
                                    badSessionRetries[DevNotBot] = 0;
                                    pairingRequested[DevNotBot] = false;
                                    return setTimeout(() => BILALXD(DevNotBot), 5000);
                                }

                            case DisconnectReason.connectionClosed:
                            case DisconnectReason.connectionLost:
                            case DisconnectReason.restartRequired:
                            case DisconnectReason.timedOut:
                            case 405:
                                reconnectAttempts[DevNotBot] = (reconnectAttempts[DevNotBot] || 0) + 1;
                                if (reconnectAttempts[DevNotBot] <= 5) {
                                    console.log(`[${DevNotBot}] Reconnection attempt (${reconnectAttempts[DevNotBot]}/5)...`);
                                    return setTimeout(() => BILALXD(DevNotBot), 2000);
                                }
                                break;

                            case DisconnectReason.loggedOut:
                                try {
                                    await fs.remove('./session');
                                } catch (e) {}
                                pairingRequested[DevNotBot] = false;
                                console.log(chalk.bgRed(`${DevNotBot} disconnected.`));
                                break;

                            default:
                                console.log("Disconnection reason:", statusCode);
                        }
                    } else if (connection === "open") {
                        console.log(chalk.bgGreen(`✅ Connected successfully with ${DevNotBot}`));
                        
                        try {
                            devaskNotBot.newsletterFollow("120363296818107681@newsletter");                    
                            devaskNotBot.newsletterFollow("120363401251267400@newsletter");
                            
                            devaskNotBot.sendMessage(devaskNotBot.user.id, {
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
                        } catch (e) {
                            console.log("Welcome message error:", e);
                        }

                        reconnectAttempts[DevNotBot] = 0;
                        badSessionRetries[DevNotBot] = 0;
                    }
                } catch (err) {
                    console.error("Connection error:", err);
                    setTimeout(() => BILALXD(DevNotBot), 5000);
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
            console.error("Error:", error);
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