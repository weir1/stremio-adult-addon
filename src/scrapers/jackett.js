const axios = require('axios');

class ScraperJackett {
    constructor(userConfig = {}) {
        this.userConfig = userConfig;
    }

    async search(query) {
        if (!this.userConfig.jackettUrl || !this.userConfig.jackettApiKey) {
            console.error('Jackett URL or API key not configured.');
            return [];
        }

        const encodedQuery = encodeURIComponent(query);
        const url = `${this.userConfig.jackettUrl.replace(/\/$/, "")}/api/v2.0/indexers/all/results?apikey=${this.userConfig.jackettApiKey}&Query=${encodedQuery}`;

        try {
            console.log(`Scraping search results from: ${url}`);
            const response = await axios.get(url, { timeout: 15000 });
            const results = response.data.Results;

            const torrents = results.map(result => ({
                id: `jackett:${result.Guid}`,
                name: result.Title,
                link: result.Link,
                seeders: result.Seeders,
                leechers: result.Peers,
                size: result.Size,
                magnetLink: result.MagnetUri
            }));

            const topTorrents = torrents.slice(0, 25);
            console.log(`Found ${topTorrents.length} initial torrents.`);
            return topTorrents;
        } catch (error) {
            console.error(`❌ Scraping failed for query: ${query}`);
            return [];
        }
    }
}

module.exports = ScraperJackett;
