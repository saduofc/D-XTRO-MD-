const { cmd } = require('../command');
const Hiru = require('hirunews-scrap');
const Esana = require('@sl-code-lords/esana-news');
const config = require('../config');

let activeGroups = {};
let lastNewsTitles = {};

const gifStyleVideos = [
    "https://files.catbox.moe/405y67.mp4",
    "https://files.catbox.moe/eslg4p.mp4"
];

function getRandomGifVideo() {
    return gifStyleVideos[Math.floor(Math.random() * gifStyleVideos.length)];
}

async function getLatestNews() {
    let newsData = [];

    try {
        const hiruApi = new Hiru();
        const hiruNews = await hiruApi.BreakingNews();

        if (hiruNews?.results?.title) {
            newsData.push({
                title: hiruNews.results.title,
                content: hiruNews.results.news || 'No content from Hiru.',
                date: hiruNews.results.date || new Date().toLocaleString()
            });
        } else {
            console.log('[Hiru] No valid data returned.');
        }
    } catch (err) {
        console.error(`[Hiru] Error: ${err.message}`);
    }

    try {
        const esanaApi = new Esana();
        const esanaNews = await esanaApi.getLatestNews();

        if (esanaNews?.title) {
            newsData.push({
                title: esanaNews.title,
                content: esanaNews.description || 'No content from Esana.',
                date: esanaNews.publishedAt || new Date().toLocaleString()
            });
        } else {
            console.log('[Esana] No valid data returned.');
        }
    } catch (err) {
        console.error(`[Esana] Error: ${err.message}`);
    }

    return newsData;
}

async function checkAndPostNews(conn, groupId) {
    const latestNews = await getLatestNews();

    if (!latestNews.length) {
        console.log(`[${groupId}] No latest news.`);
        return;
    }

    latestNews.forEach(async (newsItem) => {
        if (!lastNewsTitles[groupId]) lastNewsTitles[groupId] = [];

        if (!lastNewsTitles[groupId].includes(newsItem.title)) {
            const gifVideo = getRandomGifVideo();
            const caption = `*🔵 𝐍𝐄𝐖𝐒 𝐀𝐋𝐄𝐑𝐓!*\n▁ ▂ ▄ ▅ ▆ ▇ █ [  ] █ ▇ ▆ ▅ ▄ ▂ ▁\n\n📰 *${newsItem.title}*\n\n${newsItem.content}\n\n${newsItem.date}\n\n> *©ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴍʀ ᴅɪɴᴇꜱʜ ᴏꜰᴄ*\n> *QUEEN-SADU-MD & D-XTRO-MD*`;

            try {
                await conn.sendMessage(groupId, {
                    video: { url: gifVideo },
                    caption,
                    mimetype: "video/mp4",
                    gifPlayback: true
                });

                lastNewsTitles[groupId].push(newsItem.title);
                if (lastNewsTitles[groupId].length > 100) lastNewsTitles[groupId].shift();

                console.log(`[${groupId}] Sent: ${newsItem.title}`);
            } catch (e) {
                console.error(`[${groupId}] Failed to send: ${e.message}`);
            }
        } else {
            console.log(`[${groupId}] Already sent: ${newsItem.title}`);
        }
    });
}

// START NEWS
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

                    await conn.sendMessage(from, {
                        text: "🇱🇰 *Auto 24/7 News Activated Successfully!*\n\n> *QUEEN-SADU-MD & D-XTRO-MD*"
                    });

                    if (!activeGroups['interval']) {
                        activeGroups['interval'] = setInterval(async () => {
                            for (const groupId in activeGroups) {
                                if (groupId !== 'interval' && activeGroups[groupId]) {
                                    await checkAndPostNews(conn, groupId);
                                }
                            }
                        }, 60000); // every 1 minute
                    }
                } else {
                    await conn.sendMessage(from, {
                        text: "*✅ 24/7 News Already Activated.*\n\n> *QUEEN-SADU-MD & D-XTRO-MD*"
                    });
                }
            } else {
                await conn.sendMessage(from, {
                    text: "🚫 *Only admins or bot owner can activate this feature!*"
                });
            }
        } else {
            await conn.sendMessage(from, {
                text: "❗ This command can only be used in groups."
            });
        }
    } catch (e) {
        console.error(`startnews error: ${e.message}`);
        await conn.sendMessage(from, { text: "⚠️ Failed to activate news updates." });
    }
});

// STOP NEWS
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
                    await conn.sendMessage(from, { text: "*🛑 News updates disabled in this group.*" });

                    if (Object.keys(activeGroups).length === 1 && activeGroups['interval']) {
                        clearInterval(activeGroups['interval']);
                        delete activeGroups['interval'];
                    }
                } else {
                    await conn.sendMessage(from, { text: "⚠️ News updates are not active in this group." });
                }
            } else {
                await conn.sendMessage(from, { text: "🚫 *Only admins or bot owner can stop news updates!*" });
            }
        } else {
            await conn.sendMessage(from, { text: "❗ This command can only be used in groups." });
        }
    } catch (e) {
        console.error(`stopnews error: ${e.message}`);
        await conn.sendMessage(from, { text: "⚠️ Failed to deactivate news updates." });
    }
});
