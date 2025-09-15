const axios = require('axios');
const { parseStringPromise } = require('xml2js');

class ScraperJackett {
    constructor(userConfig = {}) {
        this.userConfig = userConfig;
    }

    async search(query) {
        if (!this.userConfig.jackettUrl || !this.userConfig.jackettApiKey) {
            console.error('Jackett URL or API key not configured.');
            return [];
        }

        const baseUrl = this.userConfig.jackettUrl.replace(/\/$/, "");
        const url = `${baseUrl}/api/v2.0/indexers/all/results/torznab?apikey=${this.userConfig.jackettApiKey}&t=search&q=${encodeURIComponent(query)}`;

        try {
            console.log(`Scraping search results from: ${url}`);
            const response = await axios.get(url, { timeout: 120000 });
            const xml = response.data;

            const result = await parseStringPromise(xml);
            const items = result.rss.channel[0].item;

            if (!items) {
                console.log('No items found in Torznab response.');
                return [];
            }

            const torrents = items.map(item => {
                const torznabAttrs = item['torznab:attr'];
                const seeders = torznabAttrs ? torznabAttrs.find(attr => attr.$.name === 'seeders')?.$.value : '0';
                const size = item.enclosure && item.enclosure[0] && item.enclosure[0].$.length ? parseInt(item.enclosure[0].$.length) : 0;

                return {
                    id: `jackett:${item.guid[0]._}`,
                    name: item.title[0],
                    link: item.link[0],
                    seeders: parseInt(seeders),
                    leechers: 0, // Torznab doesn't always provide leechers
                    size: size,
                    magnetLink: item.link[0]
                };
            });

            const topTorrents = torrents.slice(0, 25);
            console.log(`Found ${topTorrents.length} initial torrents.`);
            return topTorrents;
        } catch (error) {
            console.error(`❌ Scraping failed for query: ${query}`, error);
            return [];
        }
    }
}

module.exports = ScraperJackett;