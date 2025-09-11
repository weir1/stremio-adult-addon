// Fix undici compatibility with Node.js 18
require('./undici-fix');

const { addonBuilder, serveHTTP } = require('stremio-addon-sdk');
const Scraper1337x = require('./scrapers/1337x');

const scraper = new Scraper1337x();

// Define manifest
const manifest = {
    id: 'org.stremio.adult.addon',
    version: '1.0.0',
    name: 'Adult Content Addon',
    description: 'Stream adult content from 1337x with TorBox integration',
    resources: ['catalog', 'stream'],
    types: ['movie'],
    catalogs: [
        {
            type: 'movie',
            id: 'adult-trending',
            name: '🔥 Trending Adult'
        },
        {
            type: 'movie',
            id: 'adult-popular',
            name: '⭐ Popular Adult'
        }
    ]
};

const builder = new addonBuilder(manifest);

// Real catalog handler with 1337x scraping
builder.defineCatalogHandler(async ({ type, id, extra }) => {
    console.log('Catalog request:', { type, id, extra });
    
    if (type === 'movie') {
        try {
            let torrents = [];
            
            if (id === 'adult-trending') {
                torrents = await scraper.scrapeTrending();
            } else if (id === 'adult-popular') {
                torrents = await scraper.scrapePopular();
            }
            
            console.log(`Found ${torrents.length} torrents for catalog ${id}`);
            
            if (torrents.length === 0) {
                return {
                    metas: [{
                        id: 'no_content',
                        type: 'movie',
                        name: 'No content found - Check logs',
                        poster: 'https://via.placeholder.com/300x450/FF0000/FFFFFF?text=No+Content',
                        description: 'No torrents found. Check server logs for scraping errors.'
                    }]
                };
            }
            
            const metas = torrents.map(torrent => ({
                id: torrent.id,
                type: 'movie',
                name: torrent.name.length > 60 ? torrent.name.substring(0, 60) + '...' : torrent.name,
                poster: `https://via.placeholder.com/300x450/FF6B6B/FFFFFF?text=${encodeURIComponent(torrent.name.substring(0, 15).replace(/[^\w\s]/gi, ''))}`,
                description: `💾 Size: ${torrent.size}\n🌱 Seeders: ${torrent.seeders}\n📥 Leechers: ${torrent.leechers}\n👤 Uploader: ${torrent.uploader}`,
                genres: ['Adult'],
                releaseInfo: `${torrent.seeders} seeders`
            }));
            
            return { metas: metas };
            
        } catch (error) {
            console.error('Catalog error:', error);
            return {
                metas: [{
                    id: 'error',
                    type: 'movie',
                    name: 'Error loading content',
                    poster: 'https://via.placeholder.com/300x450/FF0000/FFFFFF?text=Error',
                    description: 'Error: ' + error.message
                }]
            };
        }
    }
    
    return { metas: [] };
});

// Real stream handler
builder.defineStreamHandler(async ({ type, id }) => {
    console.log('Stream request:', { type, id });
    
    try {
        // Try both trending and popular
        let torrents = await scraper.scrapeTrending();
        let torrent = torrents.find(t => t.id === id);
        
        if (!torrent) {
            torrents = await scraper.scrapePopular();
            torrent = torrents.find(t => t.id === id);
        }
        
        if (torrent) {
            console.log('Found torrent:', torrent.name);
            const details = await scraper.getTorrentDetails(torrent.link);
            
            const streams = [];
            
            // Direct P2P Stream (if magnet link available)
            if (details && details.magnetLink) {
                streams.push({
                    title: `🔴 Direct P2P (${torrent.seeders} seeders) - ${torrent.size}`,
                    url: details.magnetLink,
                    behaviorHints: {
                        notWebReady: true
                    }
                });
            }
            
            // TorBox Stream (placeholder for now)
            if (details && details.magnetLink) {
                streams.push({
                    title: `⚡ TorBox Stream (${torrent.size}) - Coming Soon`,
                    url: '#'
                });
            }
            
            console.log(`Returning ${streams.length} streams for ${torrent.name}`);
            return { streams: streams };
        } else {
            console.log('Torrent not found for ID:', id);
        }
        
    } catch (error) {
        console.error('Stream error:', error);
    }
    
    return { streams: [] };
});

// Start server
const port = process.env.PORT || 3000;
serveHTTP(builder.getInterface(), { 
    port: port,
    hostname: '0.0.0.0'
});

console.log('🚀 Adult Content Addon running on port ' + port);
console.log('📋 Manifest: http://192.168.100.60:' + port + '/manifest.json');
console.log('🎬 Install URL: stremio://192.168.100.60:' + port + '/manifest.json');
console.log('');
console.log('Available catalogs:');
console.log('- 🔥 Trending Adult: https://1337x.to/trending/d/xxx/');
console.log('- ⭐ Popular Adult: https://1337x.to/popular-xxx');
