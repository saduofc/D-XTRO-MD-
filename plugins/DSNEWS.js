const Esana = require('@sl-code-lords/esana-news');
const api = new Esana();
const gifVideos = [
    "https://files.catbox.moe/405y67.mp4",
    "https://files.catbox.moe/eslg4p.mp4"
];

let intervalId;
let isRunning = false;

const fetchLatestNews = async () => {
  try {
    const data = await api.getNews();
    if (!data || data.length === 0) return null;

    const top = data[0];
    const caption = `📰 *Breaking News*\n\n*${top.title}*\n\n🕒 ${top.time}\n🌐 ${top.source}\n\n───────────────\n*Powered by Mr Dinesh OFC*`;
    const randomVideo = gifVideos[Math.floor(Math.random() * gifVideos.length)];

    return { caption, video: randomVideo };
  } catch (err) {
    console.error("News Fetch Error:", err);
    return null;
  }
};

module.exports = {
  commands: ["startnews", "stopnews"],
  handler: async (m, { command, sendMessage }) => {
    if (command === "startnews") {
      if (isRunning) return sendMessage(m.chat, "🟡 පුවත් සේවය දැනටමත් ක්‍රියාත්මකයි.");

      isRunning = true;
      sendMessage(m.chat, "🟢 Sinhala News + Video system ක්‍රියාත්මක විය!");

      intervalId = setInterval(async () => {
        const news = await fetchLatestNews();
        if (!news) return;

        await sendMessage(m.chat, {
          video: { url: news.video },
          mimetype: 'video/mp4',
          caption: news.caption,
        });
      }, 1000 * 60 * 15);

    } else if (command === "stopnews") {
      if (!isRunning) return sendMessage(m.chat, "🔴 පුවත් සේවය දැනට ක්‍රියා නොකරයි.");

      clearInterval(intervalId);
      isRunning = false;
      sendMessage(m.chat, "🔕 Sinhala News + Video system නවතා දැමියි.");
    }
  }
};
