// sinhala_news_plugin.js

const { cmd } = require('../command'); const Esana = require('@sl-code-lords/esana-news'); const Parser = require('rss-parser'); const parser = new Parser();

let activeGroups = {}; let lastNewsTitles = {}; const gifVideos = [ "https://files.catbox.moe/405y67.mp4", "https://files.catbox.moe/eslg4p.mp4" ];

function getRandomGif() { return gifVideos[Math.floor(Math.random() * gifVideos.length)]; }

function isWithinLast10Minutes(pubDate) { const published = new Date(pubDate); const now = new Date(); const diff = (now - published) / 1000 / 60; // in minutes return diff <= 10; }

async function getSinhalaNews() { let newsItems = [];

try { const esana = new Esana(); const esanaData = await esana.getNews(); if (Array.isArray(esanaData)) { newsItems.push(...esanaData.map(item => ({ title: item.title, content: item.description, date: item.time || new Date().toISOString() }))); } } catch (e) { console.error("Esana API failed, trying RSS..."); }

try { const feed = await parser.parseURL('https://www.ada.lk/rss'); feed.items.forEach(item => { newsItems.push({ title: item.title, content: item.contentSnippet, date: item.pubDate }); }); } catch (e) { console.error("RSS Feed failed: " + e.message); }

return newsItems; }

async function postNews(conn, groupId) { const newsList = await getSinhalaNews(); if (!newsList.length) return;

if (!lastNewsTitles[groupId]) lastNewsTitles[groupId] = [];

for (const item of newsList) { if (!item.date || !isWithinLast10Minutes(item.date)) continue; if (lastNewsTitles[groupId].includes(item.title)) continue;

const caption = `*\uD83D\uDCF5 NEWS UPDATE!*\n\n*${item.title}*\n\n${item.content}\n\uD83D\uDD52 ${item.date}\n\n───────────────\n*© Powered by Mr Dinesh OFC*\n*QUEEN-SADU-MD & D-XTRO-MD*`;

try {
  await conn.sendMessage(groupId, {
    video: { url: getRandomGif() },
    caption,
    mimetype: "video/mp4",
    gifPlayback: true
  });

  lastNewsTitles[groupId].push(item.title);
  if (lastNewsTitles[groupId].length > 100) lastNewsTitles[groupId].shift();
} catch (e) {
  console.error("Send failed:", e.message);
}

} }

cmd({ pattern: "startnews", desc: "Enable Sinhala news updates", isGroup: true, react: "\uD83D\uDCF0", filename: __filename }, async (conn, mek, m, { from, isGroup, participants }) => { if (!isGroup) return await conn.sendMessage(from, { text: "\u274C Group only command." });

const isAdmin = participants.some(p => p.id === mek.sender && p.admin); const isOwner = mek.sender === conn.user.jid;

if (!isAdmin && !isOwner) return await conn.sendMessage(from, { text: "\uD83D\uDEAB Admin/bot owner only." });

if (activeGroups[from]) return await conn.sendMessage(from, { text: "\u2705 Already active." });

activeGroups[from] = true; await conn.sendMessage(from, { text: "\u2705 Sinhala Auto-News Activated!" });

if (!activeGroups['interval']) { activeGroups['interval'] = setInterval(async () => { for (const groupId in activeGroups) { if (groupId !== 'interval') await postNews(conn, groupId); } }, 1000 * 60 * 10); // every 10 minutes } });

cmd({ pattern: "stopnews", desc: "Disable Sinhala news updates", isGroup: true, react: "\uD83D\uDED1", filename: __filename }, async (conn, mek, m, { from, isGroup, participants }) => { if (!isGroup) return await conn.sendMessage(from, { text: "\u274C Group only command." });

const isAdmin = participants.some(p => p.id === mek.sender && p.admin); const isOwner = mek.sender === conn.user.jid;

if (!isAdmin && !isOwner) return await conn.sendMessage(from, { text: "\uD83D\uDEAB Admin/bot owner only." });

if (!activeGroups[from]) return await conn.sendMessage(from, { text: "\u26A0\uFE0F Not active yet." });

delete activeGroups[from]; await conn.sendMessage(from, { text: "\uD83D\uDED1 Sinhala News Stopped in this group" });

if (Object.keys(activeGroups).length === 1 && activeGroups['interval']) { clearInterval(activeGroups['interval']); delete activeGroups['interval']; } });

