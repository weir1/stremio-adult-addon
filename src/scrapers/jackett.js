const axios = require('axios');
const { parseStringPromise } = require('xml2js');
const parseTorrent = require('parse-torrent');
const { isCached, extractInfoHash } = require('../api/torbox');

class ScraperJackett {
    constructor(userConfig = {}) {
        this.userConfig = userConfig;
    }

    async enrichTorrentsWithTorbox(torrents) {
        if (!this.userConfig.torboxApiKey) {
            return torrents;
        }

        const enrichedTorrents = await Promise.all(torrents.map(async torrent => {
            if (!torrent.magnetLink) {
                return torrent;
            }

            const infoHash = extractInfoHash(torrent.magnetLink);
            if (!infoHash) {
                return torrent;
            }

            const cacheResult = await isCached({ infoHash, token: this.userConfig.torboxApiKey });
            return {
                ...torrent,
                cached: cacheResult.cached,
            };
        }));

        return enrichedTorrents;
    }

    async search(query) {
        if (!this.userConfig.jackettUrl || !this.userConfig.jackettApiKey) {
            console.error('Jackett URL or API key not configured.');
            return [];
        }

        const generateTorrentId = (name, link) => {
            const cleanName = name.replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '_');
            const cleanLink = link.replace(/[^a-zA-Z0-9]/g, '');
            const combined = cleanName + '_' + cleanLink;
            return Buffer.from(combined).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 20);
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

            let torrents = await Promise.all(items.map(async item => {
                const torznabAttrs = item['torznab:attr'];
                const seeders = torznabAttrs ? torznabAttrs.find(attr => attr.$.name === 'seeders')?.$.value : '0';
                const size = item.enclosure && item.enclosure[0] && item.enclosure[0].$.length ? parseInt(item.enclosure[0].$.length) : 0;
                const name = item.title[0];
                const link = item.link[0];

                let id;
                if (item.guid && item.guid[0] && typeof item.guid[0] === 'string' && item.guid[0].trim() !== '') {
                    id = `js_${item.guid[0]}`;
                } else if (item.guid && item.guid[0] && item.guid[0]._ && typeof item.guid[0]._ === 'string' && item.guid[0]._.trim() !== '') {
                    id = `js_${item.guid[0]._}`;
                } else {
                    id = `js_${generateTorrentId(name, link)}`;
                }

                let magnetLink = null;
                if (link) {
                    try {
                        const response = await axios.get(link, { responseType: 'arraybuffer', timeout: 15000 });
                        const torrentFile = Buffer.from(response.data);
                        const parsed = parseTorrent(torrentFile);
                        magnetLink = parseTorrent.toMagnetURI(parsed);
                    } catch (error) {
                        console.error(`  -> Error downloading or parsing torrent file for ${link}: ${error.message}`);
                    }
                }

                return {
                    id: id,
                    name: name,
                    link: link,
                    seeders: parseInt(seeders),
                    leechers: 0, // Torznab doesn't always provide leechers
                    size: size,
                    magnetLink: magnetLink
                };
            }));

            torrents = await this.enrichTorrentsWithTorbox(torrents);

            const topTorrents = torrents.slice(0, 25);
            console.log(`Found ${topTorrents.length} initial torrents.`);
            return topTorrents;
        } catch (error) {
            console.error(`❌ Scraping failed for query: ${query}`, error);
            return [];
        }
    }
}

module.exports = new ScraperJackett();