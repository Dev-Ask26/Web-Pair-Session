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

const require('./config')
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
                connectTimeoutMs: 60000,
                keepAliveIntervalMs: 20000,
                defaultQueryTimeoutMs: 60000,
                maxRetries: 5,
                emitOwnEvents: true,
            });

            // Sauvegarder les credentials IMMÉDIATEMENT
            devaskNotBot.ev.on('creds.update', saveCreds);

            let isConnected = false;

            // VÉRIFIER SI DÉJÀ ENREGISTRÉ AVANT DE DEMANDER LE CODE
            if (!devaskNotBot.authState.creds.registered) {
                console.log(chalk.yellow(`🔐 Device not registered, requesting pairing code...`));
                
                // Nettoyer le numéro
                let cleanNumber = DevNotBot.replace(/[^0-9]/g, '');
                if (!cleanNumber.startsWith('+')) {
                    cleanNumber = '+' + cleanNumber;
                }

                console.log(chalk.blue(`📞 Requesting pairing code for: ${cleanNumber}`));
                
                try {
                    // Générer le code de pairing
                    const code = await devaskNotBot.requestPairingCode(cleanNumber);
                    
                    console.log(chalk.green(`✅ Pairing code generated: ${code}`));
                    console.log(chalk.yellow(`📱 WhatsApp should send a notification to ${cleanNumber}`));
                    
                    // Envoyer la réponse IMMÉDIATEMENT
                    if (!res.headersSent) {
                        res.send({ 
                            code: code,
                            number: cleanNumber,
                            status: "waiting_for_pairing",
                            message: "Check your WhatsApp for pairing notification"
                        });
                    }

                } catch (pairingError) {
                    console.error(chalk.red('❌ Pairing code error:'), pairingError);
                    
                    if (!res.headersSent) {
                        res.status(500).send({ 
                            error: "Failed to generate pairing code",
                            details: pairingError.message,
                            solution: "Try again with a different number"
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
                return; // Ne pas continuer si déjà connecté
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

            // Gestion de la connexion - AMÉLIORÉE
            devaskNotBot.ev.on("connection.update", async (update) => {
                const { connection, lastDisconnect, qr, isNewLogin } = update;
                const statusCode = lastDisconnect?.error?.output?.statusCode;

                console.log(chalk.cyan(`🔗 Connection update: ${connection}`));

                if (connection === "connecting") {
                    console.log(chalk.yellow('🔄 Connecting to WhatsApp...'));
                }

                if (connection === "open") {
                    if (!isConnected) {
                        isConnected = true;
                        console.log(chalk.bgGreen(`🎉 CONNECTED SUCCESSFULLY with ${DevNotBot}`));
                        
                        // Attendre un peu avant d'envoyer les messages
                        await delay(3000);
                        
                        try {
                            // Message de bienvenue simple d'abord
                            await devaskNotBot.sendMessage(devaskNotBot.user.id, {
                                text: `✅ *BILAL BUG XD CONNECTÉ*\n\n📱 Numéro: ${DevNotBot}\n⏰ Heure: ${new Date().toLocaleString()}\n\nTapez .menu pour les commandes`
                            });

                            // Message avec image
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

                            console.log(chalk.green('✅ Welcome messages sent successfully'));

                        } catch (e) {
                            console.log(chalk.yellow('⚠️ Welcome message skipped:', e.message));
                        }
                    }
                }

                if (connection === "close") {
                    isConnected = false;
                    console.log(chalk.red(`🔴 DISCONNECTED: ${statusCode || 'Unknown reason'}`));

                    // Reconnexion automatique
                    if (statusCode === DisconnectReason.connectionLost || 
                        statusCode === DisconnectReason.timedOut) {
                        console.log(chalk.yellow('🔄 Auto-reconnecting in 5s...'));
                        setTimeout(() => BILALXD(DevNotBot), 5000);
                    }
                }
            });

            // Gestion des messages - SEULEMENT quand connecté
            devaskNotBot.ev.on("messages.upsert", async chatUpdate => {
                if (!isConnected) return;
                
                try {
                    const msg = chatUpdate.messages[0];
                    if (!msg.message || msg.key.remoteJid === 'status@broadcast') return;
                    const m = smsg(devaskNotBot, msg, store);
                    require("./handler")(devaskNotBot, m, chatUpdate, store);
                } catch (err) {
                    console.error("Message error:", err.message);
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

            devaskNotBot.sendTextWithMentions = async (jid, text, quoted, options = {}) => devaskNotBot.sendMessage(jid, { text: text, mentions: [...text.matchAll(/@(\d{0,16})/g)].map(v => v[1] + '@s.whatsapp.net'), ...options }, { quoted });

            devaskNotBot.sendText = (jid, text, quoted = '', options) => devaskNotBot.sendMessage(jid, { text: text, ...options }, { quoted });

        } catch (error) {
            console.error(chalk.red("❌ Fatal error:"), error);
            if (!res.headersSent) {
                res.status(500).send({ 
                    error: "Connection failed",
                    details: error.message
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