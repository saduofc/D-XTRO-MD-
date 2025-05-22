const { cmd } = require('../command');
const axios = require('axios');

let activeGroups = {};
let lastNewsTitles = {};
const gifVideos = [
  "https://files.catbox.moe/405y67.mp4",
  "https://files.catbox.moe/eslg4p.mp4"
];

function getRandomGif() {
  return gifVideos[Math.floor(Math.random() * gifVideos.length)];
}

function isWithinLast10Minutes(dateStr) {
  const published = new Date(dateStr);
  const now = new Date();
  return (now - published) / 1000 / 60 <= 10;
}

async function getNewsFromAPI() {
  try {
    const res = await axios.get('https://newsapimd-ffb0532c0585.herokuapp.com/');
    if (Array.isArray(res.data)) {
      return res.data.map(item => ({
        title: item.title,
        content: item.content,
        date: item.date
      }));
    }
  } catch (e) {
    console.error("News API error:", e.message);
    return [];
  }
}

async function postNews(conn, groupId) {
  const newsList = await getNewsFromAPI();
  if (!newsList.length) return;

  if (!lastNewsTitles[groupId]) lastNewsTitles[groupId] = [];

  for (const item of newsList) {
    if (!item.date || !isWithinLast10Minutes(item.date)) continue;
    if (lastNewsTitles[groupId].includes(item.title)) continue;

    const caption = `*\uD83D\uDCF0 NEWS ALERT!*\n\n*${item.title}*\n\n${item.content}\n🕒 ${item.date}\n\n───────────────\n*© Powered by Mr Dinesh OFC*\n*QUEEN-SADU-MD & D-XTRO-MD*`;

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
      console.error("Failed to send message:", e.message);
    }
  }
}

cmd({
  pattern: "startnews",
  desc: "Enable auto Sinhala news updates",
  isGroup: true,
  react: "📰",
  filename: __filename
}, async (conn, mek, m, { from, isGroup, participants }) => {
  if (!isGroup) return await conn.sendMessage(from, { text: "❌ Group only command." });
  const isAdmin = participants.some(p => p.id === mek.sender && p.admin);
  const isOwner = mek.sender === conn.user.jid;
  if (!isAdmin && !isOwner) return await conn.sendMessage(from, { text: "🚫 Admin/Bot owner only." });

  if (activeGroups[from]) return await conn.sendMessage(from, { text: "✅ Already active!" });

  activeGroups[from] = true;
  await conn.sendMessage(from, { text: "✅ Auto-News Activated!" });

  if (!activeGroups['interval']) {
    activeGroups['interval'] = setInterval(async () => {
      for (const groupId in activeGroups) {
        if (groupId !== 'interval') await postNews(conn, groupId);
      }
    }, 1000 * 60 * 10);
  }
});

cmd({
  pattern: "stopnews",
  desc: "Disable auto news",
  isGroup: true,
  react: "🛑",
  filename: __filename
}, async (conn, mek, m, { from, isGroup, participants }) => {
  if (!isGroup) return await conn.sendMessage(from, { text: "❌ Group only command." });
  const isAdmin = participants.some(p => p.id === mek.sender && p.admin);
  const isOwner = mek.sender === conn.user.jid;
  if (!isAdmin && !isOwner) return await conn.sendMessage(from, { text: "🚫 Admin/Bot owner only." });

  if (!activeGroups[from]) return await conn.sendMessage(from, { text: "⚠️ Not active in this group." });

  delete activeGroups[from];
  await conn.sendMessage(from, { text: "🛑 News updates stopped." });

  if (Object.keys(activeGroups).length === 1 && activeGroups['interval']) {
    clearInterval(activeGroups['interval']);
    delete activeGroups['interval'];
  }
});
