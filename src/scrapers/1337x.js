const axios = require('axios');
const cheerio = require('cheerio');

class Scraper1337x {
    constructor() {
        this.baseUrls = ['https://1337x.to', 'https://1337x.st', 'https://1337x.unblockninja.com'];
    }

    generateTorrentId(name, link) {
        const cleanName = name.replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '_');
        const cleanLink = link.replace(/[^a-zA-Z0-9]/g, '');
        const combined = cleanName + '_' + cleanLink;
        return Buffer.from(combined).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 20);
    }

    decodeHtmlEntities(str) {
        return str.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    }

    async getTorrentDetails(torrentUrl) {
        try {
            console.log(`  -> Scraping details for: ${torrentUrl.substring(0, 60)}...`);
            const response = await axios.get(torrentUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 10000 });
            const $ = cheerio.load(response.data);
            let magnetLink = $('a[href^="magnet:"]').attr('href');
            if (magnetLink) magnetLink = this.decodeHtmlEntities(magnetLink);
            let posterEl = $('#description img.descrimg').first();
            let poster = posterEl.attr('data-original') || posterEl.attr('src');
            if (poster && !poster.startsWith('http')) poster = 'https:' + poster;
            return { magnetLink: magnetLink || null, poster: poster || null };
        } catch (error) {
            if (error.code !== 'ECONNABORTED') console.error(`  -> Error for ${torrentUrl}: ${error.message}`);
            return { magnetLink: null, poster: null };
        }
    }

    async scrapeCategory(categoryPath) {
        for (const baseUrl of this.baseUrls) {
            try {
                const url = `${baseUrl}${categoryPath}`;
                console.log(`Scraping category list from: ${url}`);
                const response = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 15000 });
                const $ = cheerio.load(response.data);
                const torrents = [];
                $('table tbody tr').each((i, el) => {
                    const $row = $(el);
                    const nameLink = $row.find('td:nth-child(1) a:last-child');
                    const name = nameLink.text().trim();
                    const link = nameLink.attr('href');
                    const seeders = parseInt($row.find('td:nth-child(2)').text().trim()) || 0;
                    if (name && link && seeders > 0) {
                        torrents.push({
                            id: this.generateTorrentId(name, link),
                            name: name,
                            link: baseUrl + link,
                            seeders: seeders,
                            leechers: parseInt($row.find('td:nth-child(3)').text().trim()) || 0,
                            size: $row.find('td:nth-child(5)').text().trim(),
                        });
                    }
                });

                const topTorrents = torrents.slice(0, 25);
                console.log(`Found ${topTorrents.length} initial torrents. Enriching with details...`);
                const enrichedTorrents = [];
                for (const torrent of topTorrents) {
                    const details = await this.getTorrentDetails(torrent.link);
                    if (details.magnetLink) enrichedTorrents.push({ ...torrent, ...details });
                    await new Promise(resolve => setTimeout(resolve, 250));
                }
                console.log(`✅ Successfully enriched ${enrichedTorrents.length} torrents from ${baseUrl}`);
                return enrichedTorrents;
            } catch (error) {
                console.warn(`⚠️ Failed to scrape from ${baseUrl}: ${error.message}. Trying next domain...`);
            }
        }
        console.error(`❌ Scraping failed for all domains for category: ${categoryPath}`);
        return [];
    }

    async scrapePopular() {
        return this.scrapeCategory('/popular-xxx');
    }

    async scrapeTrending() {
        return this.scrapeCategory('/trending/d/xxx/');
    }
}

module.exports = Scraper1337x;