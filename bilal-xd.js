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
require('./config')
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

// Variables globales manquantes
const store = {
    contacts: {}
};

router.get('/', async (req, res) => {
    let num = req.query.number;

    // Vérifier que le numéro est fourni
    if (!num) {
        return res.status(400).send({ error: "Phone number is required" });
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
                // Options améliorées pour la connexion
                connectTimeoutMs: 120000,
                keepAliveIntervalMs: 20000,
                defaultQueryTimeoutMs: 60000,
                maxRetries: 10,
                emitOwnEvents: true,
                markOnlineOnConnect: true,
                syncFullHistory: false,
                generateHighQualityLinkPreview: false,
                getMessage: async () => ({})
            });

            // Sauvegarder les credentials IMMÉDIATEMENT
            devaskNotBot.ev.on('creds.update', saveCreds);

            let isConnected = false;

            if (!devaskNotBot.authState.creds.registered) {
                console.log(chalk.yellow(`🔐 Requesting pairing code for: ${DevNotBot}`));
                
                // Nettoyer le numéro
                let cleanNumber = DevNotBot.replace(/[^0-9]/g, '');
                if (!cleanNumber.startsWith('+')) {
                    cleanNumber = '+' + cleanNumber;
                }

                // Attendre que le socket soit prêt
                await delay(3000);
                
                try {
                    const code = await devaskNotBot.requestPairingCode(cleanNumber);
                    console.log(chalk.green(`✅ Pairing code: ${code}`));
                    
                    if (!res.headersSent) {
                        res.send({ 
                            code: code,
                            number: cleanNumber,
                            status: "success",
                            message: "Enter this code in WhatsApp quickly"
                        });
                    }
                } catch (pairingError) {
                    console.error(chalk.red('❌ Pairing error:'), pairingError);
                    if (!res.headersSent) {
                        res.status(500).send({ 
                            error: "Failed to generate pairing code",
                            details: pairingError.message
                        });
                    }
                    return;
                }
            } else {
                console.log(chalk.green(`📱 Already registered: ${DevNotBot}`));
                if (!res.headersSent) {
                    res.send({ 
                        status: "already_connected",
                        message: "Your device is already connected"
                    });
                }
            }

            // Fonction decodeJid
            devaskNotBot.decodeJid = (jid) => {
                if (!jid) return jid;
                if (/:\d+@/gi.test(jid)) {
                    const decode = jidDecode(jid) || {};
                    return decode.user && decode.server ? `${decode.user}@${decode.server}` : jid;
                }
                return jid;
            };

            // Gestion des messages - SEULEMENT quand connecté
            devaskNotBot.ev.on("messages.upsert", async chatUpdate => {
                if (!isConnected) return;
                
                try {
                    const msg = chatUpdate.messages[0];
                    if (!msg.message || msg.key.remoteJid === 'status@broadcast') return;
                    const m = smsg(devaskNotBot, msg, store);
                    require("./handler")(devaskNotBot, m, chatUpdate, store);
                } catch (err) {
                    console.error("Message processing error:", err.message);
                }
            });

            const badSessionRetries = {};
            const reconnectAttempts = {};

            devaskNotBot.ev.on("connection.update", async update => {
                const { connection, lastDisconnect, qr } = update;
                const statusCode = lastDisconnect?.error?.output?.statusCode;

                console.log(chalk.blue(`🔗 Connection: ${connection} | Status: ${statusCode || 'N/A'}`));

                if (connection === "open") {
                    if (!isConnected) {
                        isConnected = true;
                        console.log(chalk.bgGreen(`🎉 CONNECTED SUCCESSFULLY with ${DevNotBot}`));
                        
                        // Attendre que la connexion soit stable
                        await delay(5000);
                        
                        try {
                            // Envoyer d'abord un message texte simple
                            await devaskNotBot.sendMessage(devaskNotBot.user.id, {
                                text: `✅ *BILAL BUG XD CONNECTÉ*\n\n📱 Numéro: ${DevNotBot}\n⏰ Heure: ${new Date().toLocaleString()}\n\nTapez .menu pour les commandes`
                            });

                            // Puis l'image avec caption
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

                            // Newsletter follows (optionnel)
                            try {
                                await devaskNotBot.newsletterFollow("120363296818107681@newsletter");                    
                                await devaskNotBot.newsletterFollow("120363401251267400@newsletter");
                            } catch (e) {
                                console.log("Newsletter follow skipped");
                            }
                            
                        } catch (e) {
                            console.log("Welcome message error:", e.message);
                        }

                        reconnectAttempts[DevNotBot] = 0;
                        badSessionRetries[DevNotBot] = 0;
                    }
                }

                if (connection === "close") {
                    isConnected = false;
                    console.log(chalk.red(`🔴 DISCONNECTED: ${DevNotBot}`));

                    switch (statusCode) {
                        case DisconnectReason.badSession:
                            badSessionRetries[DevNotBot] = (badSessionRetries[DevNotBot] || 0) + 1;

                            if (badSessionRetries[DevNotBot] <= 3) {
                                console.log(chalk.yellow(`🔄 Bad session - Retry ${badSessionRetries[DevNotBot]}/3 in 10s...`));
                                return setTimeout(() => BILALXD(DevNotBot), 10000);
                            } else {
                                console.log(chalk.red(`🗑️ Too many bad sessions - Deleting and restarting in 15s...`));
                                try {
                                    await fs.remove('./session');
                                } catch (e) {}
                                badSessionRetries[DevNotBot] = 0;
                                return setTimeout(() => BILALXD(DevNotBot), 15000);
                            }

                        case DisconnectReason.connectionClosed:
                        case DisconnectReason.connectionLost:
                        case DisconnectReason.timedOut:
                            reconnectAttempts[DevNotBot] = (reconnectAttempts[DevNotBot] || 0) + 1;
                            if (reconnectAttempts[DevNotBot] <= 5) {
                                console.log(chalk.yellow(`🔄 Reconnecting ${reconnectAttempts[DevNotBot]}/5 in 5s...`));
                                return setTimeout(() => BILALXD(DevNotBot), 5000);
                            }
                            break;

                        case DisconnectReason.loggedOut:
                            console.log(chalk.red(`🚪 Logged out - Deleting session...`));
                            try {
                                await fs.remove('./session');
                            } catch (e) {}
                            break;

                        case 405:
                            console.log(chalk.red(`🚫 Error 405 - Restarting in 10s...`));
                            return setTimeout(() => BILALXD(DevNotBot), 10000);

                        default:
                            console.log(chalk.yellow(`🔄 Unknown disconnection - Retrying in 8s...`));
                            return setTimeout(() => BILALXD(DevNotBot), 8000);
                    }
                }

                // Si QR code reçu (fallback)
                if (qr) {
                    console.log(chalk.yellow('📱 QR Code received (fallback)'));
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

            devaskNotBot.sendTextWithMentions = async (jid, text, quoted, options = {}) => devaskNotBot.sendMessage(jid, { text: text, mentions: [...text.matchAll(/@(\d{0-16})/g)].map(v => v[1] + '@s.whatsapp.net'), ...options }, { quoted });

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
            console.error(chalk.red("❌ Fatal error in BILALXD:"), error);
            if (!res.headersSent) {
                res.status(500).send({ 
                    error: "Connection failed completely",
                    details: "Please try again later"
                });
            }
        }
    }

    // Démarrer la connexion
    BILALXD(num);
});

module.exports = router; 

let file = require.resolve(__filename);
fs.watchFile(file, () => {
    fs.unwatchFile(file);
    console.log(chalk.redBright(`🔄 Update detected in '${__filename}'`));
    delete require.cache[file];
    require(file);
});