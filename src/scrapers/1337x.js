const axios = require('axios');
const cheerio = require('cheerio');

class Scraper1337x {
    constructor() {
        this.baseUrl = 'https://1337x.to';
        this.adultCategory = '/category-search/XXX/1/';
    }

    async scrapeTrending(page = 1) {
        try {
            const url = `${this.baseUrl}/category-search/XXX/${page}/`;
            console.log('Scraping URL:', url);
            
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                timeout: 10000
            });
            
            const $ = cheerio.load(response.data);
            const torrents = [];
            
            $('tbody tr').each((index, element) => {
                const $row = $(element);
                const nameCell = $row.find('td:nth-child(1)');
                const seedersCell = $row.find('td:nth-child(2)');
                const leechersCell = $row.find('td:nth-child(3)');
                const sizeCell = $row.find('td:nth-child(5)');
                
                const name = nameCell.find('a:last-child').text().trim();
                const link = nameCell.find('a:last-child').attr('href');
                const seeders = parseInt(seedersCell.text()) || 0;
                const leechers = parseInt(leechersCell.text()) || 0;
                const size = sizeCell.text().trim();
                
                if (name && link && seeders > 0) {
                    torrents.push({
                        id: Buffer.from(name).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 20),
                        name: name,
                        link: this.baseUrl + link,
                        seeders: seeders,
                        leechers: leechers,
                        size: size
                    });
                }
            });
            
            console.log(`Found ${torrents.length} torrents`);
            return torrents.slice(0, 20); // Limit to 20 results
            
        } catch (error) {
            console.error('Scraping error:', error.message);
            return [];
        }
    }

    async getTorrentDetails(torrentUrl) {
        try {
            const response = await axios.get(torrentUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                timeout: 10000
            });
            
            const $ = cheerio.load(response.data);
            
            // Extract magnet link
            const magnetLink = $('a[href^="magnet:"]').attr('href');
            
            // Extract additional info
            const description = $('.torrent-detail-page .clearfix').text().trim();
            
            return {
                magnetLink: magnetLink || null,
                description: description || 'No description available'
            };
            
        } catch (error) {
            console.error('Error getting torrent details:', error.message);
            return null;
        }
    }
}

module.exports = Scraper1337x;
