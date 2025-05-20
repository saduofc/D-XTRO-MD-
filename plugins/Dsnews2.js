const { cmd } = require('../command'); const Hiru = require('hirunews-scrap'); const Esana = require('@sl-code-lords/esana-news'); const Parser = require('rss-parser'); const config = require('../config');

const parser = new Parser(); let activeGroups = {}; let lastNewsTitles = {};

const gifStyleVideos = [ "https://files.catbox.moe/405y67.mp4", "https://files.catbox.moe/eslg4p.mp4" ];

function getRandomGifVideo() { return gifStyleVideos[Math.floor(Math.random() * gifStyleVideos.length)]; }

async function getAdaDeranaNews() { let newsData = [];

try {
    const feed = await parser.parseURL('https://www.adaderana.lk/rss.php');
    if (feed.items && feed.items.length > 0) {
        const latestItem = feed.items[0];
        newsData.push({
            title: latestItem.title,
            content: latestItem.contentSnippet || latestItem.content || 'No content',
            date: latestItem.pubDate || new Date().toLocaleString()
        });
    }
} catch (err) {
    console.error(`[Ada Derana] Error fetching RSS feed: ${err.message}`);
}

return newsData;

}

async function getLatestNews() { let newsData = [];

try {
    const hiruApi = new Hiru();
    const hiruNews = await hiruApi.BreakingNews();
    if (hiruNews?.results?.title) {
        newsData.push({
            title: hiruNews.results.title,
            content: hiruNews.results.news || 'No content from Hiru.',
            date: hiruNews.results.date || new Date().toLocaleString()
        });
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
    }
} catch (err) {
    console.error(`[Esana] Error: ${err.message}`);
}

const adaDeranaNews = await getAdaDeranaNews();
newsData = newsData.concat(adaDeranaNews);

return newsData;

}

async function checkAndPostNews(conn, groupId) { const latestNews = await getLatestNews();

latestNews.forEach(async (newsItem) => {
    if (!lastNewsTitles[groupId]) lastNewsTitles[groupId] = [];

    if (!lastNewsTitles[groupId].includes(newsItem.title)) {
        const gifVideo = getRandomGifVideo();
        const caption = `*\uD83D\uDD35 DS ALERT!*

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

cmd({ pattern: "newson", desc: "Enable Sri Lankan news updates in this group", isGroup: true, react: "📰", filename: __filename }, async (conn, mek, m, { from, isGroup, participants }) => { try { if (isGroup) { const isAdmin = participants.some(p => p.id === mek.sender && p.admin); const isBotOwner = mek.sender === conn.user.jid;

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

cmd({ pattern: "newsoff", desc: "Disable Sri Lankan news updates in this group", isGroup: true, react: "🛑", filename: __filename }, async (conn, mek, m, { from, isGroup, participants }) => { try { if (isGroup) { const isAdmin = participants.some(p => p.id === mek.sender && p.admin); const isBotOwner = mek.sender === conn.user.jid;

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

