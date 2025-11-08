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
const { smsg, fetchJson, await: awaitfunc, sleep } = require('./database/mylib');

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

// ✅ Ajout de variables manquantes
let reconnectAttempts = {};
let pairingRequested = {};
let keepAliveInterval;
let store = { contacts: {} };

// ✅ Fonction manquante pour supprimer le dossier de session
function deleteFolderRecursive(path) {
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach((file) => {
            const curPath = `${path}/${file}`;
            if (fs.lstatSync(curPath).isDirectory()) {
                deleteFolderRecursive(curPath);
            } else {
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
}

// ✅ Fonction startpairing (appelée plus bas dans ton code)
async function startpairing(DevNotBot) {
    console.log(chalk.yellow(`🔄 Tentative de reconnexion pour ${DevNotBot}...`));
    await BILALXD(DevNotBot);
}

router.get('/', async (req, res) => {
    let num = req.query.number;
    if (!num) return res.status(400).send({ error: "Numéro manquant" });

    async function BILALXD(DevNotBot) {
        const sessionPath = './session';
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

            // ✅ Correction format numéro
            num = num.replace(/[^0-9]/g, '');
            if (!num.startsWith('+')) num = '+' + num;

            if (!devaskNotBot.authState.creds.registered) {
                await delay(1500);
                console.log(chalk.blue(`📞 Demande du code d’appairage pour ${num}...`));
                try {
                    const code = await devaskNotBot.requestPairingCode(num);
                    if (!res.headersSent) return res.send({ code });
                } catch (e) {
                    console.log(chalk.red(`❌ Connexion impossible: ${e.message}`));
                    if (!res.headersSent)
                        return res.status(500).send({ error: "Connexion impossible à WhatsApp. Vérifie ta connexion et ton numéro (+241...)." });
                    return;
                }
            }

            // ✅ Garde toute ta logique à partir d’ici
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
                const { connection, lastDisconnect } = update;
                const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;

                try {
                    if (connection === "close") {
                        clearInterval(keepAliveInterval);
                        switch (statusCode) {
                            case DisconnectReason.badSession:
                                badSessionRetries[DevNotBot] = (badSessionRetries[DevNotBot] || 0) + 1;
                                if (badSessionRetries[DevNotBot] <= 6) {
                                    console.log(chalk.yellow(`[${DevNotBot}] Bad session detected. Retrying (${badSessionRetries[DevNotBot]}/6)...`));
                                    pairingRequested[DevNotBot] = false;
                                    return setTimeout(() => startpairing(DevNotBot), 3000);
                                } else {
                                    console.log(chalk.red(`[${DevNotBot}] Max attempts reached. Deleting session.`));
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
                                    console.log(`[${DevNotBot}] Max reconnection attempts reached.`);
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
                        console.log(chalk.bgGreen(`Bot is active on ${DevNotBot}`));
                        reconnectAttempts[DevNotBot] = 0;
                        badSessionRetries[DevNotBot] = 0;
                    }
                } catch (err) {
                    console.error("Connection update error:", err.stack || err.message);
                    setTimeout(() => startpairing(DevNotBot), 5000);
                }
            });

            // Les fonctions utilitaires (stickers, texte, etc.) restent inchangées
            devaskNotBot.sendImageAsSticker = async (jid, path, quoted, options = {}) => {
                let buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await fetch(path)).buffer() : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0);
                let buffer = options && (options.packname || options.author) ? await writeExifImg(buff, options) : await imageToWebp(buff);
                await devaskNotBot.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted });
                return buffer;
            };

        } catch (error) {
            console.error("Error in BILALXD function:", error);
        }
    }

    // ✅ Appel
    await BILALXD(num);
});

module.exports = router;

let file = require.resolve(__filename);
fs.watchFile(file, () => {
    fs.unwatchFile(file);
    console.log(chalk.redBright(`Update detected in '${__filename}'`));
    delete require.cache[file];
    require(file);
});