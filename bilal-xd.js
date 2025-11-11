const express = require('express');
require('./config')
const fs = require('fs-extra');
const path = require('path');
const { exec } = require("child_process");
const router = express.Router();
const pino = require("pino");
const crypto = require('crypto');
const chalk = require("chalk");
const FileType = require('file-type');
const fetch = require('node-fetch');
const moment = require('moment-timezone');

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

// Stockage simple pour une session
let devaskNotBot = null;
let isConnecting = false;
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 3;

const store = {
    contacts: {}
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

// Fonction pour démarrer le bot
async function startBot() {
    if (isConnecting) {
        console.log(chalk.yellow('🔄 Connexion déjà en cours...'));
        return;
    }

    isConnecting = true;
    connectionAttempts++;

    try {
        const { state, saveCreds } = await useMultiFileAuthState('./session');

        devaskNotBot = makeWASocket({
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
            },
            printQRInTerminal: true,
            logger: pino({ level: "error" }),
            browser: Browsers.macOS("Safari"),
            markOnlineOnConnect: true,
        });

        // Gestion de la connexion
        devaskNotBot.ev.on("connection.update", async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                console.log(chalk.yellow('📱 QR Code reçu - Scan avec WhatsApp'));
            }

            if (connection === 'open') {
                isConnecting = false;
                connectionAttempts = 0;
                
                console.log(chalk.green('✅ Bot connecté avec succès!'));

                try {
                    // Message de bienvenue
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
█ 𝐏𝐑𝐄𝐅𝐈𝐗: *${global.prefix || '.'}*                  
█ 𝐎𝐖𝐍𝐄𝐑: *${global.owner || 'Non défini'}*
█ 𝐌𝐎𝐃𝐄: *${global.mode || 'public'}*
█ 𝐂𝐌𝐃: 𝐮𝐬𝐞 .𝐦𝐞𝐧𝐮
█▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄█
`
                    });
                } catch (e) {
                    console.log("Erreur message bienvenue:", e.message);
                }
            } 
            else if (connection === 'close') {
                isConnecting = false;
                const reason = lastDisconnect?.error?.output?.statusCode;
                
                console.log(chalk.yellow(`🔌 Connexion fermée, raison: ${reason}`));

                if (reason === DisconnectReason.badSession) {
                    console.warn('❌ Mauvaise session, suppression...');
                    await fs.remove('./session').catch(() => {});
                    if (connectionAttempts < MAX_CONNECTION_ATTEMPTS) {
                        await sleep(3000);
                        startBot();
                    }
                } 
                else if (reason === DisconnectReason.connectionClosed || 
                         reason === DisconnectReason.connectionLost) {
                    if (connectionAttempts < MAX_CONNECTION_ATTEMPTS) {
                        console.warn('🔄 Tentative de reconnexion...');
                        await sleep(5000);
                        startBot();
                    }
                } 
                else if (reason === DisconnectReason.timedOut) {
                    if (connectionAttempts < MAX_CONNECTION_ATTEMPTS) {
                        console.warn('🔄 Connexion expirée, reconnexion...');
                        await sleep(5000);
                        startBot();
                    }
                } 
                else {
                    if (connectionAttempts < MAX_CONNECTION_ATTEMPTS) {
                        console.warn('🔄 Reconnexion...');
                        await sleep(5000);
                        startBot();
                    }
                }

                if (connectionAttempts >= MAX_CONNECTION_ATTEMPTS) {
                    console.error('❌ Échec de connexion après plusieurs tentatives');
                }
            } 
            else if (connection === "connecting") {
                console.log(chalk.blue('🔄 Connexion en cours...'));
            }
        });

        // Gestion des messages
        devaskNotBot.ev.on('messages.upsert', async ({ messages, type }) => {
            try {
                const msg = messages[0];
                if (!msg || type !== "notify") return;

                // Réaction aux status
                if (msg.key && msg.key.remoteJid === "status@broadcast") {
                    await devaskNotBot.readMessages([msg.key]);
                    await devaskNotBot.sendMessage(msg.key.remoteJid, { react: { text: "❤️", key: msg.key } });
                    return;
                }

                // Traitement des messages normaux
                if (msg.message) {
                    const m = smsg(devaskNotBot, msg, store);
                    try {
                        require(`./handler`)(devaskNotBot, m, msg, store);
                    } catch (handlerError) {
                        console.log('Handler error:', handlerError.message);
                    }
                }
            } catch (err) {
                console.error('❌ Erreur messages.upsert:', err.message);
            }
        });

        // Auto-presence
        devaskNotBot.ev.on('messages.upsert', async ({ messages }) => {
            try {
                const msg = messages[0];
                if (!msg) return;
                await devaskNotBot.sendPresenceUpdate('recording', msg.key.remoteJid);
                await sleep(40000);
                await devaskNotBot.sendPresenceUpdate('paused', msg.key.remoteJid);
            } catch (err) {
                // Ignorer les erreurs de présence
            }
        });

        // Fonctions utilitaires
        devaskNotBot.decodeJid = (jid) => {
            if (!jid) return jid;
            if (/:\d+@/gi.test(jid)) {
                const decode = jidDecode(jid) || {};
                return decode.user && decode.server && `${decode.user}@${decode.server}` || jid;
            }
            return jid;
        };

        devaskNotBot.sendImageAsSticker = async (jid, path, quoted, options = {}) => {
            try {
                let buff = Buffer.isBuffer(path) ? path : 
                           /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : 
                           /^https?:\/\//.test(path) ? await getBuffer(path) : 
                           fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0);

                let buffer = options && (options.packname || options.author) ? 
                            await writeExifImg(buff, options) : 
                            await imageToWebp(buff);

                await devaskNotBot.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted });
                return buffer;
            } catch (error) {
                console.error('Error sending sticker:', error.message);
                throw error;
            }
        };

        devaskNotBot.sendVideoAsSticker = async (jid, path, quoted, options = {}) => {
            try {
                let buff = Buffer.isBuffer(path) ? path : 
                           /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : 
                           /^https?:\/\//.test(path) ? await getBuffer(path) : 
                           fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0);

                let buffer = options && (options.packname || options.author) ? 
                            await writeExifVid(buff, options) : 
                            await videoToWebp(buff);

                await devaskNotBot.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted });
                return buffer;
            } catch (error) {
                console.error('Error sending video sticker:', error.message);
                throw error;
            }
        };

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
                console.error('Error downloading media:', error.message);
                throw error;
            }
        };

        devaskNotBot.sendTextWithMentions = async (jid, text, quoted, options = {}) => {
            return devaskNotBot.sendMessage(jid, { 
                text: text, 
                mentions: [...text.matchAll(/@(\d{0,16})/g)].map(v => v[1] + '@s.whatsapp.net'), 
                ...options 
            }, { quoted });
        };

        devaskNotBot.downloadMediaMessage = async (message) => {
            try {
                let mime = (message.msg || message).mimetype || '';
                let messageType = message.mtype ? 
                    message.mtype.replace(/Message/gi, '') : 
                    mime.split('/')[0];

                const stream = await downloadContentFromMessage(message, messageType);
                let buffer = Buffer.from([]);

                for await (const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk]);
                }

                return buffer;
            } catch (error) {
                console.error('Error downloading media message:', error.message);
                throw error;
            }
        };      

        devaskNotBot.sendText = (jid, text, quoted = '', options) => {
            return devaskNotBot.sendMessage(jid, { text: text, ...options }, { quoted });
        };

        devaskNotBot.ev.on('contacts.update', update => {
            for (let contact of update) {
                let id = devaskNotBot.decodeJid(contact.id);
                if (store && store.contacts) {
                    store.contacts[id] = { id, name: contact.notify };
                }
            }
        });

        devaskNotBot.ev.on('creds.update', saveCreds);

    } catch (error) {
        isConnecting = false;
        console.error('❌ Erreur démarrage bot:', error.message);
        
        if (connectionAttempts < MAX_CONNECTION_ATTEMPTS) {
            await sleep(5000);
            startBot();
        }
    }
}

// Routes API
router.get('/', async (req, res) => {
    if (!devaskNotBot) {
        await startBot();
        return res.send({ 
            status: 'starting',
            message: 'Bot en cours de démarrage...'
        });
    }

    const isConnected = devaskNotBot.user && devaskNotBot.user.id;
    
    res.send({ 
        status: isConnected ? 'connected' : 'connecting',
        connected: isConnected,
        user: isConnected ? devaskNotBot.user : null
    });
});

router.get('/status', (req, res) => {
    const isConnected = devaskNotBot && devaskNotBot.user && devaskNotBot.user.id;
    
    res.json({ 
        connected: isConnected,
        connecting: isConnecting,
        user: isConnected ? {
            id: devaskNotBot.user.id,
            name: devaskNotBot.user.name
        } : null
    });
});

router.get('/restart', async (req, res) => {
    if (devaskNotBot) {
        try {
            await devaskNotBot.ws.close();
        } catch (e) {}
        devaskNotBot = null;
    }
    
    isConnecting = false;
    connectionAttempts = 0;
    
    await startBot();
    
    res.send({ 
        status: 'restarting',
        message: 'Redémarrage du bot...'
    });
});

// Démarrer le bot au chargement du module
startBot();

module.exports = router;

// Hot reload
let file = require.resolve(__filename);
fs.watchFile(file, () => {
    fs.unwatchFile(file);
    console.log(chalk.redBright(`🔄 Update detected in '${__filename}'`));
    delete require.cache[file];
    require(file);
});