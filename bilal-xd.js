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
const path = require('path')
require('./config');

// Import des fonctions Baileys manquantes
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

const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require('./database/bilal-xd');
const { smsg, fetchJson, getBuffer } = require('./database/mylib');

// Variables globales (à adapter selon vos besoins)

// Store pour les contacts
const store = {
    contacts: {}
};

router.get('/', async (req, res) => {
    let num = req.query.number;

    if (!num) {
        return res.status(400).send({ error: 'Le paramètre number est requis' });
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
                connectTimeoutMs: 60000,
                keepAliveIntervalMs: 25000,
            });

            // Sauvegarder les credentials
            devaskNotBot.ev.on('creds.update', saveCreds);

            if (!devaskNotBot.authState.creds.registered) {
                await delay(1000);
                num = num.replace(/[^0-9]/g, '');
                
                if (!num.startsWith('+')) {
                    num = '+' + num;
                }
                
                console.log(chalk.blue(`Demande du code de jumelage pour: ${num}`));
                
                try {
                    const code = await devaskNotBot.requestPairingCode(num);
                    console.log(chalk.green(`Code de jumelage: ${code}`));
                    
                    if (!res.headersSent) {
                        return res.send({ 
                            code: code,
                            number: num,
                            status: 'success'
                        });
                    }
                } catch (error) {
                    console.error('Erreur lors de la demande du code:', error);
                    if (!res.headersSent) {
                        return res.status(500).send({ 
                            error: 'Erreur lors de la demande du code de jumelage',
                            details: error.message
                        });
                    }
                }
            }

            // Fonction pour décoder les JID
            devaskNotBot.decodeJid = (jid) => {
                if (!jid) return jid;
                if (/:\d+@/gi.test(jid)) {
                    const decode = jidDecode(jid) || {};
                    return decode.user && decode.server && `${decode.user}@${decode.server}` || jid;
                }
                return jid;
            };

            // Gestion des messages
            devaskNotBot.ev.on("messages.upsert", async chatUpdate => {
                try {
                    const msg = chatUpdate.messages[0];
                    if (!msg.message || msg.key.remoteJid === 'status@broadcast') return;
                    
                    const m = smsg(devaskNotBot, msg, store);
                    
                    // Charger et exécuter le handler
                    try {
                        const handler = require("./handler");
                        if (handler && typeof handler === 'function') {
                            await handler(devaskNotBot, m, chatUpdate, store);
                        }
                    } catch (handlerError) {
                        console.error("Erreur du handler:", handlerError);
                    }
                } catch (err) {
                    console.error("Erreur de traitement du message:", err);
                }
            });

            const badSessionRetries = {};
            const reconnectAttempts = {};
            const pairingRequested = {};

            // Gestion de la connexion
            devaskNotBot.ev.on("connection.update", async update => {
                const { connection, lastDisconnect, qr } = update;
                const statusCode = lastDisconnect?.error?.output?.statusCode;

                console.log(chalk.yellow(`Statut de connexion: ${connection}`));

                try {
                    if (connection === "close") {
                        console.log(chalk.red(`Déconnecté. Code: ${statusCode}`));
                        
                        switch (statusCode) {
                            case DisconnectReason.badSession:
                                badSessionRetries[DevNotBot] = (badSessionRetries[DevNotBot] || 0) + 1;

                                if (badSessionRetries[DevNotBot] <= 3) {
                                    console.log(chalk.yellow(`[${DevNotBot}] Session corrompue. Nouvel essai (${badSessionRetries[DevNotBot]}/3)...`));
                                    pairingRequested[DevNotBot] = false;
                                    return setTimeout(() => BILALXD(DevNotBot), 5000);
                                } else {
                                    console.log(chalk.red(`[${DevNotBot}] Maximum d'essais atteint. Suppression de la session...`));
                                    try {
                                        await fs.remove('./session');
                                    } catch (e) {
                                        console.error('Erreur suppression session:', e);
                                    }
                                    badSessionRetries[DevNotBot] = 0;
                                    pairingRequested[DevNotBot] = false;
                                    return setTimeout(() => BILALXD(DevNotBot), 10000);
                                }

                            case DisconnectReason.connectionClosed:
                            case DisconnectReason.connectionLost:
                            case DisconnectReason.restartRequired:
                            case DisconnectReason.timedOut:
                                reconnectAttempts[DevNotBot] = (reconnectAttempts[DevNotBot] || 0) + 1;
                                if (reconnectAttempts[DevNotBot] <= 5) {
                                    console.log(chalk.yellow(`[${DevNotBot}] Tentative de reconnexion (${reconnectAttempts[DevNotBot]}/5)...`));
                                    return setTimeout(() => BILALXD(DevNotBot), 3000);
                                }
                                break;

                            case DisconnectReason.loggedOut:
                                console.log(chalk.red(`[${DevNotBot}] Déconnecté. Suppression de la session...`));
                                try {
                                    await fs.remove('./session');
                                } catch (e) {
                                    console.error('Erreur suppression session:', e);
                                }
                                pairingRequested[DevNotBot] = false;
                                break;

                            default:
                                console.log(chalk.red(`Raison de déconnexion: ${statusCode}`));
                                // Reconnexion automatique pour les autres erreurs
                                setTimeout(() => BILALXD(DevNotBot), 5000);
                        }
                    } else if (connection === "open") {
                        console.log(chalk.bgGreen(`✅ Connecté avec succès: ${DevNotBot}`));
                        
                        try {
                            // Message de bienvenue AVEC IMAGE
                            const welcomeCaption = `
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
`;

                            // Envoyer l'image avec caption
                            await devaskNotBot.sendMessage(devaskNotBot.user.id, {
                                image: { url: 'https://i.ibb.co/qYG993MS/72a4e407f204.jpg' },
                                caption: welcomeCaption
                            });

                            console.log(chalk.green('✅ Message de bienvenue envoyé avec image'));

                        } catch (e) {
                            console.log("Erreur message de bienvenue:", e);
                            
                            // En cas d'erreur avec l'image, envoyer le texte seulement
                            try {
                                const welcomeText = `
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
`;
                                await devaskNotBot.sendMessage(devaskNotBot.user.id, {
                                    text: welcomeText
                                });
                                console.log(chalk.yellow('✅ Message de bienvenue envoyé (texte seulement)'));
                            } catch (textError) {
                                console.log("Erreur message texte de bienvenue:", textError);
                            }
                        }

                        reconnectAttempts[DevNotBot] = 0;
                        badSessionRetries[DevNotBot] = 0;
                    } else if (qr) {
                        console.log(chalk.blue('QR Code reçu'));
                    }
                } catch (err) {
                    console.error("Erreur de connexion:", err);
                    setTimeout(() => BILALXD(DevNotBot), 10000);
                }
            });

            // Fonction pour envoyer des stickers
            devaskNotBot.sendImageAsSticker = async (jid, path, quoted, options = {}) => {
                try {
                    let buff = Buffer.isBuffer(path) ? path : 
                               /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : 
                               /^https?:\/\//.test(path) ? await (await getBuffer(path)) : 
                               fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0);
                    
                    let buffer = options && (options.packname || options.author) ? 
                                await writeExifImg(buff, options) : 
                                await imageToWebp(buff);
                    
                    await devaskNotBot.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted });
                    return buffer;
                } catch (error) {
                    console.error('Erreur sendImageAsSticker:', error);
                    throw error;
                }
            };

            devaskNotBot.sendVideoAsSticker = async (jid, path, quoted, options = {}) => {
                try {
                    let buff = Buffer.isBuffer(path) ? path : 
                               /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : 
                               /^https?:\/\//.test(path) ? await (await getBuffer(path)) : 
                               fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0);
                    
                    let buffer = options && (options.packname || options.author) ? 
                                await writeExifVid(buff, options) : 
                                await videoToWebp(buff);
                    
                    await devaskNotBot.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted });
                    return buffer;
                } catch (error) {
                    console.error('Erreur sendVideoAsSticker:', error);
                    throw error;
                }
            };

            // Fonction pour télécharger et sauvegarder les médias
            devaskNotBot.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
                try {
                    let quoted = message.msg ? message.msg : message;
                    let mime = (message.msg || message).mimetype || '';
                    let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0];
                    
                    const stream = await downloadContentFromMessage(quoted, messageType);
                    let buffer = Buffer.from([]);
                    
                    for await (const chunk of stream) {
                        buffer = Buffer.concat([buffer, chunk]);
                    }
                    
                    let type = await FileType.fromBuffer(buffer);
                    let trueFileName = attachExtension ? (filename + '.' + (type?.ext || 'bin')) : filename;
                    
                    await fs.writeFileSync(trueFileName, buffer);
                    return trueFileName;
                } catch (error) {
                    console.error('Erreur downloadAndSaveMediaMessage:', error);
                    throw error;
                }
            };

            // Fonction pour envoyer du texte avec mentions
            devaskNotBot.sendTextWithMentions = async (jid, text, quoted, options = {}) => {
                return devaskNotBot.sendMessage(jid, { 
                    text: text, 
                    mentions: [...text.matchAll(/@(\d{0,16})/g)].map(v => v[1] + '@s.whatsapp.net'), 
                    ...options 
                }, { quoted });
            };

            // Fonction pour télécharger les médias
            devaskNotBot.downloadMediaMessage = async (message) => {
                try {
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
                } catch (error) {
                    console.error('Erreur downloadMediaMessage:', error);
                    throw error;
                }
            };

            // Fonction utilitaire pour envoyer du texte
            devaskNotBot.sendText = (jid, text, quoted = '', options) => {
                return devaskNotBot.sendMessage(jid, { text: text, ...options }, { quoted });
            };

            // Mise à jour des contacts
            devaskNotBot.ev.on('contacts.update', update => {
                for (let contact of update) {
                    let id = devaskNotBot.decodeJid(contact.id);
                    if (store && store.contacts) {
                        store.contacts[id] = { id, name: contact.notify };
                    }
                }
            });

        } catch (error) {
            console.error("Erreur lors de l'initialisation:", error);
            if (!res.headersSent) {
                res.status(500).send({ 
                    error: 'Erreur lors de l initialisation du bot',
                    details: error.message 
                });
            }
        }
    }

    BILALXD(num);
});

module.exports = router;

// Rechargement automatique du fichier
let file = require.resolve(__filename);
fs.watchFile(file, () => {
    fs.unwatchFile(file);
    console.log(chalk.redBright(`Mise à jour détectée dans '${__filename}'`));
    delete require.cache[file];
    require(file);
});