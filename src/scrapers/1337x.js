const axios = require('axios');
const cheerio = require('cheerio');

class Scraper1337x {
    constructor() {
        this.baseUrl = 'https://1337x.to';
    }

    async scrapeCategory(categoryPath) {
        try {
            const url = `${this.baseUrl}${categoryPath}`;
            console.log('Scraping URL:', url);
            
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                },
                timeout: 15000
            });
            
            const $ = cheerio.load(response.data);
            const torrents = [];
            
            // Find the table body and iterate through rows
            $('table tbody tr').each((index, element) => {
                try {
                    const $row = $(element);
                    
                    // Extract name and link from first column
                    const nameLink = $row.find('td:nth-child(1) a:last-child');
                    const name = nameLink.text().trim();
                    const link = nameLink.attr('href');
                    
                    // Extract seeders and leechers  
                    const seeders = parseInt($row.find('td:nth-child(2)').text().trim()) || 0;
                    const leechers = parseInt($row.find('td:nth-child(3)').text().trim()) || 0;
                    
                    // Extract size from the size column
                    const sizeText = $row.find('td:nth-child(5)').text().trim();
                    
                    // Extract uploader
                    const uploader = $row.find('td:nth-child(6)').text().trim();
                    
                    if (name && link && seeders > 0) {
                        const torrentId = Buffer.from(link).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 20);
                        
                        torrents.push({
                            id: torrentId,
                            name: name,
                            link: this.baseUrl + link,
                            seeders: seeders,
                            leechers: leechers,
                            size: sizeText,
                            uploader: uploader
                        });
                    }
                } catch (err) {
                    console.log('Error parsing row:', err.message);
                }
            });
            
            console.log(`Found ${torrents.length} torrents from ${url}`);
            return torrents.slice(0, 20); // Limit to 20 results
            
        } catch (error) {
            console.error('Scraping error for', categoryPath, ':', error.message);
            return [];
        }
    }

    async scrapePopular() {
        return this.scrapeCategory('/popular-xxx');
    }

    async scrapeTrending() {
        return this.scrapeCategory('/trending/d/xxx/');
    }

    async getTorrentDetails(torrentUrl) {
        try {
            console.log('Getting details for:', torrentUrl);
            
            const response = await axios.get(torrentUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                timeout: 10000
            });
            
            const $ = cheerio.load(response.data);
            
            // Extract magnet link
            const magnetLink = $('a[href^="magnet:"]').attr('href');
            
            // Extract description
            const description = $('.torrent-detail-page .clearfix').text().trim() || 
                              $('.box-info-detail').text().trim() || 
                              'No description available';
            
            return {
                magnetLink: magnetLink || null,
                description: description
            };
            
        } catch (error) {
            console.error('Error getting torrent details:', error.message);
            return null;
        }
    }
}

module.exports = Scraper1337x;
