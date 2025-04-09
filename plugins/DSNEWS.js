const { cmd } = require('../command');
const Hiru = require('hirunews-scrap');
const Esana = require('@sl-code-lords/esana-news');
const axios = require('axios');
const config = require('../config');

let activeGroups = {};
let lastNewsTitles = {};

const videoLinks = [
    "https://files.catbox.moe/hjrrxn.gif",
    "https://files.catbox.moe/hjrrxn.gif"
];

function getRandomVideoLink() {
    return videoLinks[Math.floor(Math.random() * videoLinks.length)];
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
    } catch (err) {
        console.error(`Error fetching Hiru News: ${err.message}`);
    }

    try {
        const esanaApi = new Esana();
        const esanaNews = await esanaApi.getLatestNews();
        if (esanaNews?.title && esanaNews?.description && esanaNews?.publishedAt) {
            newsData.push({
                title: esanaNews.title,
                content: esanaNews.description,
                date: esanaNews.publishedAt
            });
        }
    } catch (err) {
        console.error(`Error fetching Esana News: ${err.message}`);
    }

    return newsData;
}

async function checkAndPostNews(conn, groupId) {
    const latestNews = await getLatestNews();

    latestNews.forEach(async (newsItem) => {
        if (!lastNewsTitles[groupId]) lastNewsTitles[groupId] = [];

        if (!lastNewsTitles[groupId].includes(newsItem.title)) {
            const randomVideo = getRandomVideoLink();

            try {
                await conn.sendMessage(groupId, {
                    video: { url: randomVideo },
                    caption: `*🔵𝐍𝐄𝐖𝐒 𝐀𝐋𝐄𝐑𝐓!*\n▁ ▂ ▄ ▅ ▆ ▇ █ [  ] █ ▇ ▆ ▅ ▄ ▂ ▁\n\n📰 *${newsItem.title}*\n${newsItem.content}\n\n${newsItem.date}\n\n> *©ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴍʀ ᴅɪɴᴇꜱʜ ᴏꜰᴄ*\n> *QUEEN-SADU-MD & D-XTRO-MD*`
                });

                lastNewsTitles[groupId].push(newsItem.title);
                if (lastNewsTitles[groupId].length > 100) lastNewsTitles[groupId].shift();

            } catch (e) {
                console.error(`Failed to send video message: ${e.message}`);
            }
        }
    });
}

cmd({
    pattern: "startnews",
    desc: "Enable Sri Lankan news updates in this group",
    isGroup: true,
    react: "📰",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, participants }) => {
    try {
        if (isGroup) {
            const isAdmin = participants.some(p => p.id === mek.sender && p.admin);
            const isBotOwner = mek.sender === conn.user.jid;

            if (isAdmin || isBotOwner) {
                if (!activeGroups[from]) {
                    activeGroups[from] = true;

                    await conn.sendMessage(from, { text: "🇱🇰 Auto 24/7 News Activated.\n\n> QUEEN-SADU-MD & D-XTRO-MD" });

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
                    await conn.sendMessage(from, { text: "*✅ 24/7 News Already Activated.*\n\n> QUEEN-SADU-MD & D-XTRO-MD" });
                }
            } else {
                await conn.sendMessage(from, { text: "🚫 This command can only be used by group admins or the bot owner." });
            }
        } else {
            await conn.sendMessage(from, { text: "This command can only be used in groups." });
        }
    } catch (e) {
        console.error(`Error in startnews command: ${e.message}`);
        await conn.sendMessage(from, { text: "Failed to activate the news service." });
    }
});

cmd({
    pattern: "stopnews",
    desc: "Disable Sri Lankan news updates in this group",
    isGroup: true,
    react: "🛑",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, participants }) => {
    try {
        if (isGroup) {
            const isAdmin = participants.some(p => p.id === mek.sender && p.admin);
            const isBotOwner = mek.sender === conn.user.jid;

            if (isAdmin || isBotOwner) {
                if (activeGroups[from]) {
                    delete activeGroups[from];
                    await conn.sendMessage(from, { text: "*🚫 Disable Sri Lankan news updates in this group*" });

                    if (Object.keys(activeGroups).length === 1 && activeGroups['interval']) {
                        clearInterval(activeGroups['interval']);
                        delete activeGroups['interval'];
                    }
                } else {
                    await conn.sendMessage(from, { text: "🛑 24/7 News is not active in this group.\n\n> ©QUEEN-SADU-MD & D-XTRO-MD" });
                }
            } else {
                await conn.sendMessage(from, { text: "🚫 This command can only be used by group admins or the bot owner." });
            }
        } else {
            await conn.sendMessage(from, { text: "This command can only be used in groups." });
        }
    } catch (e) {
        console.error(`Error in stopnews command: ${e.message}`);
        await conn.sendMessage(from, { text: "Failed to deactivate the news service." });
    }
});
