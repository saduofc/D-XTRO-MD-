// news-plugin.js
const { cmd } = require('../command');
const Hiru = require('hirunews-scrap');
const Esana = require('@sl-code-lords/esana-news');
const config = require('../config');
const translate = require('@vitalets/google-translate-api');

let activeGroups = {};
let lastNewsTitles = {};

const gifStyleVideos = [
    "https://files.catbox.moe/u8r3o9.mp4",
    "https://files.catbox.moe/9m5wx6.mp4"
];

function getRandomGifVideo() {
    return gifStyleVideos[Math.floor(Math.random() * gifStyleVideos.length)];
}

async function getLatestNews() {
    let newsData = [];
    try {
        const hiruApi = new Hiru();
        const hiruNews = await hiruApi.BreakingNews();
        newsData.push({
            title: hiruNews.results.title,
            content: hiruNews.results.news,
            date: hiruNews.results.date
        });
    } catch {}
    try {
        const esanaApi = new Esana();
        const esanaNews = await esanaApi.getLatestNews();
        newsData.push({
            title: esanaNews.title,
            content: esanaNews.description,
            date: esanaNews.publishedAt
        });
    } catch {}
    return newsData;
}

async function checkAndPostNews(conn, groupId) {
    const latestNews = await getLatestNews();
    latestNews.forEach(async (newsItem) => {
        if (!lastNewsTitles[groupId]) lastNewsTitles[groupId] = [];
        if (!lastNewsTitles[groupId].includes(newsItem.title)) {
            const gifVideo = getRandomGifVideo();
            const caption = `*\u{1F535} 𝐍𝐄𝐖𝐒 𝐀𝐋𝐄𝐑𝐓!*\n▁ ▂ ▄ ▅ ▆ ▇ █ [  ] █ ▇ ▆ ▅ ▄ ▂ ▁\n\n📰 *${newsItem.title}*\n\n${newsItem.content}\n\n${newsItem.date}\n\n> *© Powered by Mr Dinesh*\n> *QUEEN-SADU-MD & D-XTRO-MD*`;

            try {
                const sentMsg = await conn.sendMessage(groupId, {
                    video: { url: gifVideo },
                    caption,
                    mimetype: "video/mp4",
                    gifPlayback: true,
                    buttons: [
                        { buttonId: "translate_en", buttonText: { displayText: "English" }, type: 1 }
                    ],
                    headerType: 4
                });

                // Save message ID to use when reacting
                lastNewsTitles[groupId].push(newsItem.title);
                if (lastNewsTitles[groupId].length > 100) lastNewsTitles[groupId].shift();
            } catch (e) {
                console.error("Send failed:", e.message);
            }
        }
    });
}

// Auto translation on button click
cmd({ pattern: "translate_en", fromMe: false }, async (conn, m) => {
    const originalText = m.quoted?.message?.videoMessage?.caption || m.quoted?.message?.extendedTextMessage?.text;
    if (!originalText) return;

    try {
        const translated = await translate(originalText, { to: 'en' });
        await conn.sendMessage(m.chat, { text: `*\u{1F1EC}\u{1F1E7} English Translation:*

${translated.text}` }, { quoted: m });
    } catch (e) {
        await conn.sendMessage(m.chat, { text: "\u274C Translation failed." }, { quoted: m });
    }
});

cmd({
    pattern: "newson",
    desc: "Enable Sri Lankan news updates in this group",
    isGroup: true,
    react: "\u{1F4F0}",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, participants }) => {
    if (!participants.some(p => p.id === mek.sender && p.admin)) return;
    if (!activeGroups[from]) {
        activeGroups[from] = true;
        await conn.sendMessage(from, { text: "🇱🇰 Auto 24/7 News Activated." });
        if (!activeGroups['interval']) {
            activeGroups['interval'] = setInterval(async () => {
                for (const groupId in activeGroups) {
                    if (activeGroups[groupId] && groupId !== 'interval') {
                        await checkAndPostNews(conn, groupId);
                    }
                }
            }, 60000);
        }
    } else {
        await conn.sendMessage(from, { text: "\u2705 Already Activated." });
    }
});

cmd({
    pattern: "newsoff",
    desc: "Disable Sri Lankan news updates in this group",
    isGroup: true,
    react: "\u{1F6D1}",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, participants }) => {
    if (!participants.some(p => p.id === mek.sender && p.admin)) return;
    if (activeGroups[from]) {
        delete activeGroups[from];
        await conn.sendMessage(from, { text: "\u{1F6D1} News updates disabled." });
        if (Object.keys(activeGroups).length === 1 && activeGroups['interval']) {
            clearInterval(activeGroups['interval']);
            delete activeGroups['interval'];
        }
    } else {
        await conn.sendMessage(from, { text: "Not Active." });
    }
});
