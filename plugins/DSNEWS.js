const { cmd } = require('../command');
const Esana = require('@sl-code-lords/esana-news');

let activeGroups = {};
let lastNewsTitles = {};
const gifVideos = [
  "https://files.catbox.moe/405y67.mp4",
  "https://files.catbox.moe/eslg4p.mp4"
];

function getRandomGif() {
  return gifVideos[Math.floor(Math.random() * gifVideos.length)];
}

async function fetchNews() {
  try {
    const api = new Esana();
    const newsArray = await api.getNews();
    return newsArray.map(n => ({
      title: n.title,
      content: n.description || '',
      date: n.time || ''
    }));
  } catch (err) {
    console.error('News Fetch Error:', err.message);
    return [];
  }
}

async function sendNewsToGroup(conn, groupId) {
  const newsList = await fetchNews();
  if (!newsList.length) return;

  if (!lastNewsTitles[groupId]) lastNewsTitles[groupId] = [];

  for (const item of newsList) {
    if (lastNewsTitles[groupId].includes(item.title)) continue;

    const caption = `*🔵 𝐍𝐄𝐖𝐒 𝐀𝐋𝐄𝐑𝐓!*\n▁ ▂ ▄ ▅ ▆ ▇ █ █ ▇ ▆ ▅ ▄ ▂ ▁\n\n*${item.title}*\n\n${item.content}\n🕒 ${item.date}\n\n───────────────\n*© Powered by Mr Dinesh OFC*\n*QUEEN-SADU-MD & D-XTRO-MD*`;

    try {
      await conn.sendMessage(groupId, {
        video: { url: getRandomGif() },
        caption,
        mimetype: 'video/mp4',
        gifPlayback: true
      });

      lastNewsTitles[groupId].push(item.title);
      if (lastNewsTitles[groupId].length > 100) lastNewsTitles[groupId].shift();
    } catch (e) {
      console.error(`Failed to send news: ${e.message}`);
    }
  }
}

cmd({
  pattern: "startnews",
  desc: "Enable Sinhala news updates 24/7",
  isGroup: true,
  react: "📰",
  filename: __filename
}, async (conn, mek, m, { from, isGroup, participants }) => {
  if (!isGroup) return await conn.sendMessage(from, { text: "❌ Group command only." });

  const isAdmin = participants.some(p => p.id === mek.sender && p.admin);
  const isOwner = mek.sender === conn.user.jid;

  if (!isAdmin && !isOwner) return await conn.sendMessage(from, { text: "🚫 Admins or bot owner only." });

  if (activeGroups[from]) return await conn.sendMessage(from, { text: "*✅ News already active.*" });

  activeGroups[from] = true;
  await conn.sendMessage(from, { text: "✅ *Sinhala Auto-News Activated*\nWill send news every 30 minutes." });

  if (!activeGroups['interval']) {
    activeGroups['interval'] = setInterval(async () => {
      for (const groupId in activeGroups) {
        if (groupId !== 'interval' && activeGroups[groupId]) {
          await sendNewsToGroup(conn, groupId);
        }
      }
    }, 1000 * 60 * 30); // Every 30 mins
  }
});

cmd({
  pattern: "stopnews",
  desc: "Disable Sinhala news updates",
  isGroup: true,
  react: "🛑",
  filename: __filename
}, async (conn, mek, m, { from, isGroup, participants }) => {
  if (!isGroup) return await conn.sendMessage(from, { text: "❌ Group command only." });

  const isAdmin = participants.some(p => p.id === mek.sender && p.admin);
  const isOwner = mek.sender === conn.user.jid;

  if (!isAdmin && !isOwner) return await conn.sendMessage(from, { text: "🚫 Admins or bot owner only." });

  if (!activeGroups[from]) return await conn.sendMessage(from, { text: "⚠️ News not active in this group." });

  delete activeGroups[from];
  await conn.sendMessage(from, { text: "🛑 *News updates stopped in this group*" });

  if (Object.keys(activeGroups).length === 1 && activeGroups['interval']) {
    clearInterval(activeGroups['interval']);
    delete activeGroups['interval'];
  }
});
