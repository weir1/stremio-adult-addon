const axios = require('axios');
const cheerio = require('cheerio');

class Scraper1337x {
    constructor() {
        this.baseUrl = 'https://1337x.to';
    }

    // Standardized ID generation
    generateTorrentId(name, link) {
        const cleanName = name.replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '_');
        const cleanLink = link.replace(/[^a-zA-Z0-9]/g, '');
        const combined = cleanName + '_' + cleanLink;
        return Buffer.from(combined).toString('base64')
            .replace(/[^a-zA-Z0-9]/g, '')
            .substring(0, 20);
    }

    // Decode HTML entities in URLs
    decodeHtmlEntities(str) {
        return str
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'");
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
            
            $('table tbody tr').each((index, element) => {
                try {
                    const $row = $(element);
                    
                    const nameLink = $row.find('td:nth-child(1) a:last-child');
                    const name = nameLink.text().trim();
                    const link = nameLink.attr('href');
                    
                    const seeders = parseInt($row.find('td:nth-child(2)').text().trim()) || 0;
                    const leechers = parseInt($row.find('td:nth-child(3)').text().trim()) || 0;
                    const sizeText = $row.find('td:nth-child(5)').text().trim();
                    const uploader = $row.find('td:nth-child(6)').text().trim();
                    
                    if (name && link && seeders > 0) {
                        const torrentId = this.generateTorrentId(name, link);
                        
                        torrents.push({
                            id: torrentId,
                            name: name,
                            link: this.baseUrl + link,
                            seeders: seeders,
                            leechers: leechers,
                            size: sizeText,
                            uploader: uploader
                        });
                        
                        if (index < 3) {
                            console.log(`🆔 Generated ID: ${torrentId} for: ${name.substring(0, 30)}`);
                        }
                    }
                } catch (err) {
                    // Skip problematic rows
                }
            });
            
            console.log(`Found ${torrents.length} torrents from ${url}`);
            return torrents.slice(0, 20);
            
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
            
            // Extract magnet link and decode HTML entities
            let magnetLink = $('a[href^="magnet:"]').attr('href');
            if (magnetLink) {
                magnetLink = this.decodeHtmlEntities(magnetLink);
                console.log('✅ Magnet link found and decoded!');
            } else {
                console.log('❌ No magnet link found');
            }
            
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
