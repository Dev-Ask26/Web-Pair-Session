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

// Stockage des sessions actives
const activeSessions = new Map();
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

// Fonction pour créer une session unique
function createSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Créer le dossier sessions s'il n'existe pas
const sessionsDir = path.join(__dirname, 'session');
if (!fs.existsSync(sessionsDir)) {
    fs.mkdirSync(sessionsDir, { recursive: true });
}

router.get('/', async (req, res) => {
    let num = req.query.number;
    const sessionId = req.query.sessionId || createSessionId();

    if (!num) {
        return res.status(400).send({ error: 'Le paramètre number est requis' });
    }

    async function BILALXD(phoneNumber, currentSessionId) {
        const sessionPath = path.join(sessionsDir, currentSessionId);
        
        // Créer le dossier de session s'il n'existe pas
        await fs.ensureDir(sessionPath);

        const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

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

            // Stocker la session dans la map
            activeSessions.set(currentSessionId, {
                socket: devaskNotBot,
                sessionPath: sessionPath,
                connected: false,
                user: phoneNumber
            });

            if (!devaskNotBot.authState.creds.registered) {
                await delay(1500);
                phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
                try {
                    const code = await devaskNotBot.requestPairingCode(phoneNumber);
                    if (!res.headersSent) {
                        res.send({ 
                            code: code,
                            sessionId: currentSessionId,
                            message: 'Utilisez ce sessionId pour les futures connexions'
                        });
                    }
                    return;
                } catch (error) {
                    console.error('Erreur lors de la demande de code pairing:', error);
                    if (!res.headersSent) {
                        res.status(500).send({ error: 'Erreur lors de la demande de code' });
                    }
                    return;
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

            // Function Message and connexion 
            devaskNotBot.ev.on("connection.update", async (update) => {
                const { connection, lastDisconnect } = update;
                
                if (connection === 'open') {
                    // Mettre à jour le statut de la session
                    const session = activeSessions.get(currentSessionId);
                    if (session) {
                        session.connected = true;
                        activeSessions.set(currentSessionId, session);
                    }

                    try {
                        // Newsletter follows
                        try {
                            await devaskNotBot.newsletterFollow("120363296818107681@newsletter");                    
                            await devaskNotBot.newsletterFollow("120363401251267400@newsletter");
                        } catch (newsletterError) {
                            console.log('Newsletter follow non supporté ou erreur:', newsletterError.message);
                        }
                        
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
█ 𝐒𝐄𝐒𝐒𝐈𝐎𝐍: ${currentSessionId}
█ 𝐂𝐌𝐃: 𝐮𝐬𝐞 .𝐦𝐞𝐧𝐮
█▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄█
`
                        });
                    } catch (e) {
                        console.log("Erreur lors de l'envoi du message de connexion:", e.message);
                    }

                    console.log(chalk.green(`✅ Bot connected! Session: ${currentSessionId} | User: ${phoneNumber}`));
                } else if (connection === 'close') {
                    const session = activeSessions.get(currentSessionId);
                    if (session) {
                        session.connected = false;
                        activeSessions.set(currentSessionId, session);
                    }

                    const reason = lastDisconnect?.error?.output?.statusCode;
                    console.log(chalk.yellow(`🔌 Connexion fermée pour ${currentSessionId}, raison: ${reason}`));
                    
                    if (reason === DisconnectReason.badSession) {
                        console.warn(`❌ Mauvaise session ${currentSessionId}, suppression...`);
                        activeSessions.delete(currentSessionId);
                        await fs.remove(sessionPath).catch(() => {});
                    } else if (reason === DisconnectReason.connectionClosed) {
                        console.warn(`🔄 Connexion fermée pour ${currentSessionId}, tentative de reconnexion...`);
                        await sleep(5000);
                        BILALXD(phoneNumber, currentSessionId);
                    } else if (reason === DisconnectReason.connectionLost) {
                        console.warn(`🔄 Connexion perdue pour ${currentSessionId}, tentative de reconnexion...`);
                        await sleep(5000);
                        BILALXD(phoneNumber, currentSessionId);
                    } else if (reason === DisconnectReason.connectionReplaced) {
                        console.warn(`🔄 Session ${currentSessionId} remplacée, déconnexion...`);
                        activeSessions.delete(currentSessionId);
                    } else if (reason === DisconnectReason.loggedOut) {
                        console.warn(`❌ Session ${currentSessionId} déconnectée, suppression...`);
                        activeSessions.delete(currentSessionId);
                        await fs.remove(sessionPath).catch(() => {});
                    } else if (reason === DisconnectReason.restartRequired) {
                        console.warn(`🔄 Redémarrage requis pour ${currentSessionId}, redémarrage...`);
                        await sleep(2000);
                        BILALXD(phoneNumber, currentSessionId);
                    } else if (reason === DisconnectReason.timedOut) {
                        console.warn(`🔄 Connexion expirée pour ${currentSessionId}, tentative de reconnexion...`);
                        await sleep(5000);
                        BILALXD(phoneNumber, currentSessionId);
                    } else {
                        console.warn(`🔄 Connexion fermée sans raison spécifique pour ${currentSessionId}, tentative de reconnexion...`);
                        await sleep(5000);
                        BILALXD(phoneNumber, currentSessionId);
                    }
                } else if (connection === "connecting") {
                    console.log(chalk.blue(`🔄 Connexion en cours pour ${currentSessionId}...`));
                }
            });

            // Function Message upsert
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
                    console.error(`❌ Erreur dans messages.upsert pour ${currentSessionId}:`, err.message);
                }
            });
            
            // Auto-recording Présence Online
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
            console.error(`❌ Error in BILALXD function for session ${currentSessionId}:`, error.message);
            // Nettoyer en cas d'erreur
            activeSessions.delete(currentSessionId);
        }
    }

    // Vérifier si une session existe déjà
    if (req.query.sessionId && activeSessions.has(req.query.sessionId)) {
        const existingSession = activeSessions.get(req.query.sessionId);
        if (existingSession.connected) {
            return res.send({ 
                message: 'Session déjà connectée',
                sessionId: req.query.sessionId,
                connected: true
            });
        }
    }

    // Appeler la fonction BILALXD
    BILALXD(num, sessionId);
});

// Route pour lister les sessions actives
router.get('/sessions', (req, res) => {
    const sessions = [];
    activeSessions.forEach((session, sessionId) => {
        sessions.push({
            sessionId: sessionId,
            connected: session.connected,
            user: session.user,
            sessionPath: session.sessionPath
        });
    });
    res.json({ 
        success: true,
        sessions: sessions, 
        total: sessions.length 
    });
});

// Route pour déconnecter une session spécifique
router.get('/logout', async (req, res) => {
    const sessionId = req.query.sessionId;
    if (sessionId && activeSessions.has(sessionId)) {
        const session = activeSessions.get(sessionId);
        try {
            if (session.socket) {
                await session.socket.ws.close();
            }
            activeSessions.delete(sessionId);
            await fs.remove(session.sessionPath).catch(() => {});
            res.json({ 
                success: true,
                message: 'Session déconnectée avec succès', 
                sessionId: sessionId 
            });
        } catch (error) {
            res.status(500).json({ 
                success: false,
                error: 'Erreur lors de la déconnexion: ' + error.message 
            });
        }
    } else {
        res.status(404).json({ 
            success: false,
            error: 'Session non trouvée' 
        });
    }
});

// Route pour envoyer un message via une session spécifique
router.post('/send-message', async (req, res) => {
    const { sessionId, jid, message } = req.body;
    
    if (!sessionId || !activeSessions.has(sessionId)) {
        return res.status(404).json({ 
            success: false,
            error: 'Session non trouvée' 
        });
    }

    const session = activeSessions.get(sessionId);
    if (!session.connected) {
        return res.status(400).json({ 
            success: false,
            error: 'Session non connectée' 
        });
    }

    try {
        await session.socket.sendMessage(jid, { text: message });
        res.json({ 
            success: true, 
            message: 'Message envoyé avec succès' 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: 'Erreur lors de l\'envoi du message: ' + error.message 
        });
    }
});

// Route pour obtenir les informations d'une session
router.get('/session/:sessionId', (req, res) => {
    const sessionId = req.params.sessionId;
    if (sessionId && activeSessions.has(sessionId)) {
        const session = activeSessions.get(sessionId);
        res.json({
            success: true,
            session: {
                sessionId: sessionId,
                connected: session.connected,
                user: session.user,
                sessionPath: session.sessionPath
            }
        });
    } else {
        res.status(404).json({
            success: false,
            error: 'Session non trouvée'
        });
    }
});

module.exports = router;

// Hot reload
let file = require.resolve(__filename);
fs.watchFile(file, () => {
    fs.unwatchFile(file);
    console.log(chalk.redBright(`🔄 Update detected in '${__filename}'`));
    delete require.cache[file];
    require(file);
});