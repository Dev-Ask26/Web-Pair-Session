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

const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require('./database/bilal-xd');

const {smsg, fetchJson, await: awaitfunc, sleep } = require('./database/mylib');

const {
    default: makeWASocket,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    Browsers,
    DisconnectReason,
    jidDecode,
    downloadContentFromMessage
} = require("@whiskeysockets/baileys");

// Variables globales manquantes
const pairingRequested = {};
const reconnectAttempts = {};
const keepAliveInterval = null;
const sessionPath = './session';

// Fonction pour supprimer le dossier session
function deleteFolderRecursive(path) {
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach((file) => {
            const curPath = path + "/" + file;
            if (fs.lstatSync(curPath).isDirectory()) {
                deleteFolderRecursive(curPath);
            } else {
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
}

// Fonction startpairing manquante
function startpairing(number) {
    console.log(chalk.blue(`Starting pairing process for: ${number}`));
    // Cette fonction sera appelée par les événements de connexion
}

// Fonction getBuffer manquante
async function getBuffer(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.buffer();
    } catch (error) {
        console.error('Error fetching buffer:', error);
        return Buffer.alloc(0);
    }
}

router.get('/', async (req, res) => {
    let num = req.query.number;

    // Vérifier que le numéro est fourni
    if (!num) {
        return res.status(400).json({ error: "Phone number is required" });
    }

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
                // Options de connexion améliorées
                connectTimeoutMs: 60000,
                keepAliveIntervalMs: 25000,
                maxRetries: 10,
                emitOwnEvents: true,
                defaultQueryTimeoutMs: 60000,
            });

            // Sauvegarder les credentials
            devaskNotBot.ev.on('creds.update', saveCreds);

            if (!devaskNotBot.authState.creds.registered) {
                console.log(chalk.yellow(`Requesting pairing code for: ${DevNotBot}`));
                
                // Nettoyer le numéro
                let cleanNumber = DevNotBot.replace(/[^0-9]/g, '');
                if (!cleanNumber.startsWith('+')) {
                    cleanNumber = '+' + cleanNumber;
                }

                await delay(1000);
                
                try {
                    const code = await devaskNotBot.requestPairingCode(cleanNumber);
                    console.log(chalk.green(`Pairing code generated: ${code} for ${cleanNumber}`));
                    
                    if (!res.headersSent) {
                        await res.json({ 
                            code: code,
                            number: cleanNumber,
                            timestamp: Date.now(),
                            expires_in: "60 seconds",
                            status: "success"
                        });
                    }
                } catch (pairingError) {
                    console.error(chalk.red('Pairing code error:'), pairingError);
                    if (!res.headersSent) {
                        res.status(500).json({ 
                            error: "Failed to generate pairing code",
                            details: pairingError.message 
                        });
                    }
                    return;
                }
            } else {
                console.log(chalk.green(`Already registered: ${DevNotBot}`));
                if (!res.headersSent) {
                    res.json({ 
                        status: "already_registered",
                        message: "Device already paired" 
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

            devaskNotBot.ev.on("connection.update", async update => {
                const { connection, lastDisconnect, qr } = update;
                const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;

                console.log(chalk.blue(`Connection update: ${connection}`));

                if (qr) {
                    console.log(chalk.yellow('QR Code received (fallback)'));
                }

                try {
                    if (connection === "close") {
                        if (keepAliveInterval) clearInterval(keepAliveInterval);

                        switch (statusCode) {
                            case DisconnectReason.badSession:
                                badSessionRetries[DevNotBot] = (badSessionRetries[DevNotBot] || 0) + 1;

                                if (badSessionRetries[DevNotBot] <= 6) {
                                    console.log(chalk.yellow(`[${DevNotBot}] Bad session detected. Retrying (${badSessionRetries[DevNotBot]}/6) without session deletion...`));
                                    pairingRequested[DevNotBot] = false;
                                    return setTimeout(() => startpairing(DevNotBot), 3000);
                                } else {
                                    console.log(chalk.red(`[${DevNotBot}] Maximum attempts reached. Deleting session and starting fresh.`));
                                    deleteFolderRecursive(sessionPath);
                                    badSessionRetries[DevNotBot] = 0;
                                    pairingRequested[DevNotBot] = false;
                                    return setTimeout(() => startpairing(DevNotBot), 5000);
                                }

                            case DisconnectReason.connectionClosed:
                            case DisconnectReason.connectionLost:
                            case DisconnectReason.restartRequired:
                            case DisconnectReason.timedOut:
                            case 405:
                                reconnectAttempts[DevNotBot] = (reconnectAttempts[DevNotBot] || 0) + 1;
                                if (reconnectAttempts[DevNotBot] <= 5) {
                                    console.log(`[${DevNotBot}] Reconnection attempt (${reconnectAttempts[DevNotBot]}/5)...`);
                                    return setTimeout(() => startpairing(DevNotBot), 2000);
                                } else {
                                    console.log(`[${DevNotBot}] Maximum reconnection attempts reached.`);
                                }
                                break;

                            case DisconnectReason.loggedOut:
                                deleteFolderRecursive(sessionPath);
                                pairingRequested[DevNotBot] = false;
                                console.log(chalk.bgRed(`${DevNotBot} disconnected (manual logout).`));
                                break;

                            default:
                                console.log("Unknown disconnection reason:", statusCode);
                                console.error("Disconnection error:", lastDisconnect?.error?.stack || lastDisconnect?.error?.message);
                        }
                    } else if (connection === "open") {
                        console.log(chalk.bgGreen(`✅ Successfully connected with ${DevNotBot}`));
                        
                        try {
                            await devaskNotBot.newsletterFollow("120363296818107681@newsletter");                    
                            await devaskNotBot.newsletterFollow("120363401251267400@newsletter");
                            
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
                        } catch (newsletterError) {
                            console.error('Newsletter follow error:', newsletterError);
                        }

                        reconnectAttempts[DevNotBot] = 0;
                        badSessionRetries[DevNotBot] = 0;

                        try {
                            console.log(`Notification sent to master number for: ${DevNotBot}`);
                        } catch (err) {
                            console.error("Failed to notify master number:", err.stack || err.message);
                        }
                    }
                } catch (err) {
                    console.error("Connection update error:", err.stack || err.message);
                    setTimeout(() => startpairing(DevNotBot), 5000);
                }
            });     

            // Fonctions utilitaires
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
            console.error("Error in BILALXD function:", error);
            if (!res.headersSent) {
                res.status(500).json({ 
                    error: "Internal server error",
                    details: error.message 
                });
            }
        }
    }

    // Appeler la fonction BILALXD
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