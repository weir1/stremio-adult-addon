const axios = require('axios');
const cheerio = require('cheerio');

class Scraper1337x {
    constructor(userConfig = {}) {
        this.baseUrls = ['https://1337x.to', 'https://1337x.st', 'https://1337x.unblockninja.com'];
        this.userConfig = userConfig;
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

    async _makeRequest(url) {
        if (this.userConfig && this.userConfig.flaresolverrUrl) {
            console.log(`  -> Using FlareSolverr at ${this.userConfig.flaresolverrUrl}`);
            const response = await axios.post(`${this.userConfig.flaresolverrUrl}/v1`, {
                cmd: 'request.get',
                url: url,
                maxTimeout: 60000
            }, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 70000
            });
            if (response.data.solution) {
                return response.data.solution.response;
            } else {
                throw new Error(`FlareSolverr did not return a solution. Response: ${JSON.stringify(response.data)}`);
            }
        } else {
            const response = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 15000 });
            return response.data;
        }
    }

    async getTorrentDetails(torrentUrl) {
        try {
            console.log(`  -> Scraping details for: ${torrentUrl.substring(0, 60)}...`);
            const html = await this._makeRequest(torrentUrl);
            const $ = cheerio.load(html);
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
                const html = await this._makeRequest(url);
                const $ = cheerio.load(html);
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

    async search(query) {
        const encodedQuery = encodeURIComponent(query).replace(/%20/g, '+');
        for (const baseUrl of this.baseUrls) {
            try {
                const url = `${baseUrl}/search/${encodedQuery}/1/`;
                console.log(`Scraping search results from: ${url}`);
                const html = await this._makeRequest(url);
                const $ = cheerio.load(html);
                const torrents = [];
                $('table tbody tr').each((i, el) => {
                    const $row = $(el);
                    const nameLink = $row.find('td.coll-1 a:last-child');
                    const name = nameLink.text().trim();
                    const link = nameLink.attr('href');
                    const seeders = parseInt($row.find('td.coll-2').text().trim()) || 0;
                    if (name && link && seeders > 0) {
                        torrents.push({
                            id: this.generateTorrentId(name, link),
                            name: name,
                            link: baseUrl + link,
                            seeders: seeders,
                            leechers: parseInt($row.find('td.coll-3').text().trim()) || 0,
                            size: $row.find('td.coll-4').text().trim(),
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
        console.error(`❌ Scraping failed for all domains for query: ${query}`);
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