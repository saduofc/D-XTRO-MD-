const { cmd } = require('../command'); const Parser = require('rss-parser'); const config = require('../config');

const parser = new Parser(); let activeGroups = {}; let lastNewsTitles = {};

const gifStyleVideos = [ "https://files.catbox.moe/405y67.mp4", "https://files.catbox.moe/eslg4p.mp4" ];

function getRandomGifVideo() { return gifStyleVideos[Math.floor(Math.random() * gifStyleVideos.length)]; }

async function getHiruNewsFromRSS() { let newsData = [];

try {
    const feed = await parser.parseURL('https://www.hirunews.lk/rss/mainnews.xml');
    if (feed.items && feed.items.length > 0) {
        const latestItem = feed.items[0];
        newsData.push({
            title: latestItem.title,
            content: latestItem.contentSnippet || latestItem.content || 'No content',
            date: latestItem.pubDate || new Date().toLocaleString()
        });
    }
} catch (err) {
    console.error(`[Hiru RSS] Error fetching RSS feed: ${err.message}`);
}

return newsData;

}

async function getLatestNews() { const hiruNews = await getHiruNewsFromRSS(); return hiruNews; }

async function checkAndPostNews(conn, groupId) { const latestNews = await getLatestNews();

latestNews.forEach(async (newsItem) => {
    if (!lastNewsTitles[groupId]) lastNewsTitles[groupId] = [];

    if (!lastNewsTitles[groupId].includes(newsItem.title)) {
        const gifVideo = getRandomGifVideo();
        const caption = `*\uD83D\uDD35 NEWS ALERT!*

▁ ▂ ▄ ▅ ▆ ▇ █ [  ] █ ▇ ▆ ▅ ▄ ▂ ▁

📰 ${newsItem.title}

${newsItem.content}

${newsItem.date}

> © Powered by Mr Dinesh OFC QUEEN-SADU-MD & D-XTRO-MD`;



try {
            await conn.sendMessage(groupId, {
                video: { url: gifVideo },
                caption,
                mimetype: "video/mp4",
                gifPlayback: true
            });

            lastNewsTitles[groupId].push(newsItem.title);
            if (lastNewsTitles[groupId].length > 100) lastNewsTitles[groupId].shift();

        } catch (e) {
            console.error(`Failed to send video message: ${e.message}`);
        }
    }
});

}

cmd({ pattern: "startnews", desc: "Enable Sri Lankan news updates in this group", isGroup: true, react: "📰", filename: __filename }, async (conn, mek, m, { from, isGroup, participants }) => { try { if (isGroup) { const isAdmin = participants.some(p => p.id === mek.sender && p.admin); const isBotOwner = mek.sender === conn.user.jid;

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
            await conn.sendMessage(from, { text: "🚫 Only group admins or bot owner can use this command." });
        }
    } else {
        await conn.sendMessage(from, { text: "This command can only be used in groups." });
    }
} catch (e) {
    console.error(`Error in startnews command: ${e.message}`);
    await conn.sendMessage(from, { text: "Failed to activate news service." });
}

});

cmd({ pattern: "stopnews", desc: "Disable Sri Lankan news updates in this group", isGroup: true, react: "🛑", filename: __filename }, async (conn, mek, m, { from, isGroup, participants }) => { try { if (isGroup) { const isAdmin = participants.some(p => p.id === mek.sender && p.admin); const isBotOwner = mek.sender === conn.user.jid;

if (isAdmin || isBotOwner) {
            if (activeGroups[from]) {
                delete activeGroups[from];
                await conn.sendMessage(from, { text: "*🛑 News updates disabled in this group*" });

                if (Object.keys(activeGroups).length === 1 && activeGroups['interval']) {
                    clearInterval(activeGroups['interval']);
                    delete activeGroups['interval'];
                }
            } else {
                await conn.sendMessage(from, { text: "⚠️ News updates not active in this group." });
            }
        } else {
            await conn.sendMessage(from, { text: "🚫 Only group admins or bot owner can use this command." });
        }
    } else {
        await conn.sendMessage(from, { text: "This command can only be used in groups." });
    }
} catch (e) {
    console.error(`Error in stopnews command: ${e.message}`);
    await conn.sendMessage(from, { text: "Failed to deactivate news service." });
}

});

