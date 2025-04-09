const { cmd } = require('../command');
const Hiru = require('hirunews-scrap');
const Esana = require('@sl-code-lords/esana-news');

let activeGroups = {};
let lastNewsTitles = {};

// Add your gif/video links here
const videoLinks = [
    "https://files.catbox.moe/v5ieze.gif",
    "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZGNiZ2xnYXg3enNxeTg1NnpxaTJ2eGFhczlmeTZvYjFpYTFobW5lbyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/xUPGcguWZHRC2HyBRS/giphy.gif"
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
                    gifPlayback: true,
                    caption: `*🔵 𝐍𝐄𝐖𝐒 𝐀𝐋𝐄𝐑𝐓!*\n▁ ▂ ▄ ▅ ▆ ▇ █ [  ] █ ▇ ▆ ▅ ▄ ▂ ▁\n\n📰 *${newsItem.title}*\n${newsItem.content}\n\n🗓️ ${newsItem.date}\n\n> *© Powered by Mr Dinesh OFC*\n> *QUEEN-SADU-MD & D-XTRO-MD*`
                });

                lastNewsTitles[groupId].push(newsItem.title);
                if (lastNewsTitles[groupId].length > 100) lastNewsTitles[groupId].shift();

            } catch (e) {
                console.error(`Failed to send news with video: ${e.message}`);
            }
        }
    });
}

// Activate news updates in group
cmd({
    pattern: "startnews",
    desc: "Enable Sri Lankan news updates in this group",
    isGroup: true,
    react: "📰",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, participants }) => {
    try {
        if (!isGroup) return await conn.sendMessage(from, { text: "This command can only be used in groups." });

        const isAdmin = participants.some(p => p.id === mek.sender && p.admin);
        const isBotOwner = mek.sender === conn.user.jid;

        if (!(isAdmin || isBotOwner)) return await conn.sendMessage(from, { text: "🚫 Only group admins or bot owner can use this command." });

        if (!activeGroups[from]) {
            activeGroups[from] = true;
            await conn.sendMessage(from, { text: "✅ 24/7 Sri Lankan News Activated.\n> *QUEEN-SADU-MD & D-XTRO-MD*" });

            if (!activeGroups['interval']) {
                activeGroups['interval'] = setInterval(async () => {
                    for (const groupId in activeGroups) {
                        if (activeGroups[groupId] && groupId !== 'interval') {
                            await checkAndPostNews(conn, groupId);
                        }
                    }
                }, 60000); // Every 1 min
            }
        } else {
            await conn.sendMessage(from, { text: "*⚠️ News is already active in this group.*" });
        }

    } catch (e) {
        console.error(e);
        await conn.sendMessage(from, { text: "❌ Failed to activate news." });
    }
});

// Deactivate news updates
cmd({
    pattern: "stopnews",
    desc: "Disable Sri Lankan news updates in this group",
    isGroup: true,
    react: "🛑",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, participants }) => {
    try {
        if (!isGroup) return await conn.sendMessage(from, { text: "This command can only be used in groups." });

        const isAdmin = participants.some(p => p.id === mek.sender && p.admin);
        const isBotOwner = mek.sender === conn.user.jid;

        if (!(isAdmin || isBotOwner)) return await conn.sendMessage(from, { text: "🚫 Only group admins or bot owner can use this command." });

        if (activeGroups[from]) {
            delete activeGroups[from];
            await conn.sendMessage(from, { text: "🛑 News updates disabled for this group." });

            if (Object.keys(activeGroups).length === 1 && activeGroups['interval']) {
                clearInterval(activeGroups['interval']);
                delete activeGroups['interval'];
            }
        } else {
            await conn.sendMessage(from, { text: "⚠️ News is not currently active in this group." });
        }

    } catch (e) {
        console.error(e);
        await conn.sendMessage(from, { text: "❌ Failed to deactivate news." });
    }
});
