const express = require('express');
require('./config')
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
const { smsg, fetchJson, await: awaitfunc, sleep } = require('./database/mylib');

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

// Store pour gérer les données
const store = {
    messages: [],
    contacts: {},
    chats: {},
    async loadMessage(jid, id, conn) {
        return this.messages.find(m => m.key?.id === id && m.key?.remoteJid === jid);
    }
};

async function getBuffer(url) {
    try {
        const response = await fetch(url);
        return await response.buffer();
    } catch (e) {
        console.error("Erreur getBuffer:", e);
        return null;
    }
}

// Fixed pairing code pour l'adapter avec la nouvelle version de Bailey 

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
            });

            if (!devaskNotBot.authState.creds.registered) {
                await delay(1500);
                num = num.replace(/[^0-9]/g, '');
                const code = await devaskNotBot.requestPairingCode(num);
                if (!res.headersSent) await res.send({ code });
            }

            devaskNotBot.decodeJid = (jid) => {
                if (!jid) return jid;
                if (/:\d+@/gi.test(jid)) {
                    const decode = jidDecode(jid) || {};
                    return decode.user && decode.server && `${decode.user}@${decode.server}` || jid;
                }
                return jid;
            };

            //Function Message and connexion 
            devaskNotBot.ev.on("connection.update", async (update) => {
                const { connection, lastDisconnect } = update;
                if (connection === 'open') {
                    try {
                        devaskNotBot.newsletterFollow("120363296818107681@newsletter");                                            
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
                        console.log("Erreur lors de l'envoi du message de connexion:", e);
                    }

                    //auth connexion on bot
                    console.log(chalk.green('Bot connected!'));
                    console.log(chalk.blue('✅ Commandes maintenant actives!'));
                } else if (connection === 'close') {
                    const reason = lastDisconnect?.error?.output?.statusCode;
                    if (reason === DisconnectReason.badSession) {
                        console.warn(`Mauvaise session, supprimez la session et scannez à nouveau.`);
                        process.exit();
                    } else if (reason === DisconnectReason.connectionClosed) {
                        console.warn('Connexion fermée, tentative de reconnexion...');
                        await sleep(5000); // Attendre avant de reconnecter
                        BILALXD();
                    } else if (reason === DisconnectReason.connectionLost) {
                        console.warn('Connexion perdue, tentative de reconnexion...');
                        await sleep(5000); // Attendre avant de reconnecter
                        BILALXD();
                    } else if (reason === DisconnectReason.connectionReplaced) {
                        console.warn('Session remplacée, déconnexion...');
                        devaskNotBot.logout();
                    } else if (reason === DisconnectReason.loggedOut) {
                        console.warn('Déconnecté, veuillez scanner à nouveau.');
                        devaskNotBot.logout();
                    } else if (reason === DisconnectReason.restartRequired) {
                        console.warn('Redémarrage requis, redémarrage...');
                        await BILALXD();
                    } else if (reason === DisconnectReason.timedOut) {
                        console.warn('Connexion expirée, tentative de reconnexion...');
                        await sleep(5000); // Attendre avant de reconnecter
                        BILALXD();
                    } else {
                        console.warn('Connexion fermée sans raison spécifique, tentative de reconnexion...');
                        await sleep(5000); // Attendre avant de reconnecter
                        BILALXD();
                    }
                } else if (connection === "connecting") {
                    console.warn('Connexion en cours...');
                }
            });

            // CORRECTION CRITIQUE : Gestion des messages avec appel correct du handler
            devaskNotBot.ev.on('messages.upsert', async ({ messages, type }) => {
                try {
                    const msg = messages[0] || messages[messages.length - 1];
                    if (type !== "notify") return;
                    if (!msg?.message) return;
                    
                    // Auto-like status
                    if (msg.key && msg.key.remoteJid === "status@broadcast") {
                        await devaskNotBot.readMessages([msg.key]);
                        await devaskNotBot.sendMessage(msg.key.remoteJid, { react: { text: "❤️", key: msg.key } });
                        return;
                    }
                    
                    // Stocker le message
                    store.messages.push(msg);
                    
                    // Préparer le message avec smsg
                    const m = smsg(devaskNotBot, msg, store);
                    
                    console.log(chalk.yellow(`📨 Message reçu de: ${m.sender}`));
                    console.log(chalk.cyan(`💬 Contenu: ${m.text || m.body || '[Media]'}`));
                    
                    // Appeler le handler avec tous les paramètres nécessaires
                    require(`./handler`)(devaskNotBot, m, msg, store);
                    
                } catch (err) {
                    console.error('❌ Erreur dans messages.upsert:', err);
                }
            });
            

            // Gestion des contacts
            devaskNotBot.ev.on('contacts.update', update => {
                for (let contact of update) {
                    let id = devaskNotBot.decodeJid(contact.id);
                    if (store && store.contacts) {
                        store.contacts[id] = { id, name: contact.notify };
                    }
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

            devaskNotBot.ev.on('creds.update', saveCreds);

        } catch (error) {
            console.error("Error in BILALXD function:", error);
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