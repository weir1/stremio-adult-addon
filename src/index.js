const { addonBuilder, serveHTTP } = require('stremio-addon-sdk');

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
            name: 'Trending Adult'
        }
    ]
};

const builder = new addonBuilder(manifest);

// Test catalog handler
builder.defineCatalogHandler(({ type, id, extra }) => {
    console.log('Catalog request:', { type, id, extra });
    
    return Promise.resolve({
        metas: [
            {
                id: 'test_id_1',
                type: 'movie',
                name: 'Test Adult Content 1',
                poster: 'https://via.placeholder.com/300x450/FF0000/FFFFFF?text=Test+1',
                description: 'Test description for adult content'
            },
            {
                id: 'test_id_2',
                type: 'movie',
                name: 'Test Adult Content 2',
                poster: 'https://via.placeholder.com/300x450/00FF00/000000?text=Test+2',
                description: 'Another test description'
            }
        ]
    });
});

// Test stream handler
builder.defineStreamHandler(({ type, id }) => {
    console.log('Stream request:', { type, id });
    
    return Promise.resolve({
        streams: [
            {
                title: 'Direct P2P Stream (Instant)',
                url: 'magnet:?xt=urn:btih:08ada5a7a6183aae1e09d831df6748d566095a10'
            },
            {
                title: 'TorBox Stream (Preparing...)',
                url: '#'
            }
        ]
    });
});

// Use the official serveHTTP method
const port = process.env.PORT || 3000;
serveHTTP(builder.getInterface(), { 
    port: port,
    hostname: '0.0.0.0'
});

console.log('Addon server running on port ' + port);
console.log('Manifest: http://192.168.100.60:' + port + '/manifest.json');
console.log('Install URL: stremio://192.168.100.60:' + port + '/manifest.json');
