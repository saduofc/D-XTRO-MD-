const axios = require('axios');
const cheerio = require('cheerio');

async function getLatestAdaderanaNews() {
    try {
        const { data } = await axios.get('https://sinhala.adaderana.lk/');
        const $ = cheerio.load(data);

        const firstNewsBlock = $('.catNews-1').first();
        const title = firstNewsBlock.find('a').text().trim();
        const content = firstNewsBlock.find('p').text().trim();
        const date = firstNewsBlock.find('.news-date').text().trim();

        if (title && content) {
            return {
                title,
                content,
                date: date || new Date().toLocaleDateString()
            };
        } else {
            throw new Error('No valid news found');
        }
    } catch (err) {
        console.error('Adaderana Scraper Error:', err.message);
        return null;
    }
}

module.exports = { getLatestAdaderanaNews };
