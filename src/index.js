const { addonBuilder, serveHTTP } = require('stremio-addon-sdk');
const Scraper1337x = require('./scrapers/1337x');

const scraper = new Scraper1337x();

// In-memory caches
let trendingCache = [];
let popularCache = [];
let lastCacheUpdate = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function getCachedTorrents(kind) {
  const now = Date.now();
  if (now - lastCacheUpdate > CACHE_DURATION) {
    console.log('🔄 Refreshing torrent cache...');
    trendingCache = await scraper.scrapeTrending();
    popularCache  = await scraper.scrapePopular();
    lastCacheUpdate = now;
    console.log(`📦 Cache updated: ${trendingCache.length} trending, ${popularCache.length} popular`);
    if (trendingCache.length) {
      console.log('🆔 Sample trending IDs:', trendingCache.slice(0,3).map(t => t.id));
    }
  }
  return kind === 'trending' ? trendingCache : popularCache;
}

// IMPORTANT: expose meta + stream with idPrefixes for custom IDs
const ID_PREFIXES = ['T25','TW9','TWl','UG9','Qnl','TW9t'];

const manifest = {
  id: 'org.stremio.adult.addon',
  version: '1.0.7', // bump to force client refresh
  name: 'Adult Content Addon',
  description: 'Stream adult content from 1337x with TorBox integration',
  resources: [
    'catalog',
    { name: 'meta',   types: ['movie'], idPrefixes: ID_PREFIXES },
    { name: 'stream', types: ['movie'], idPrefixes: ID_PREFIXES }
  ],
  types: ['movie'],
  idPrefixes: ID_PREFIXES,
  catalogs: [
    { type: 'movie', id: 'adult-trending', name: '🔥 Trending Adult' },
    { type: 'movie', id: 'adult-popular',  name: '⭐ Popular Adult' }
  ]
};

const builder = new addonBuilder(manifest);

// Catalog handler
builder.defineCatalogHandler(async ({ type, id, extra }) => {
  console.log('📋 Catalog request:', { type, id, extra });
  if (type !== 'movie') return { metas: [] };

  try {
    let torrents = [];
    if (id === 'adult-trending') torrents = await getCachedTorrents('trending');
    else if (id === 'adult-popular') torrents = await getCachedTorrents('popular');

    console.log(`📊 Found ${torrents.length} torrents for catalog ${id}`);

    if (!torrents.length) {
      return {
        metas: [{
          id: 'no_content',
          type: 'movie',
          name: '🔄 Loading content...',
          poster: 'https://via.placeholder.com/300x450/FF6B6B/FFFFFF?text=Loading...',
          description: 'Content is loading. Please refresh in a moment.'
        }]
      };
    }

    const metas = torrents.map(t => ({
      id: t.id, // must start with one of ID_PREFIXES
      type: 'movie',
      name: t.name.length > 80 ? t.name.slice(0,80) + '...' : t.name,
      poster: `https://via.placeholder.com/300x450/FF6B6B/FFFFFF?text=${encodeURIComponent(t.name.slice(0,10).replace(/[^\w]/g,''))}`,
      description: `💾 Size: ${t.size}\n🌱 Seeders: ${t.seeders}\n📥 Leechers: ${t.leechers}${t.uploader ? `\n👤 Uploader: ${t.uploader}` : ''}`,
      genres: ['Adult'],
      releaseInfo: `${t.seeders} seeders`
    }));

    return { metas };
  } catch (err) {
    console.error('❌ Catalog error:', err);
    return { metas: [] };
  }
});

// Meta handler (minimal) — ensures routing for custom IDs
builder.defineMetaHandler(async ({ type, id }) => {
  console.log('🧾 Meta request:', { type, id });
  if (type !== 'movie') return { meta: null };

  try {
    await getCachedTorrents('trending');
    const all = [...trendingCache, ...popularCache];
    const t = all.find(x => x.id === id);

    if (!t) {
      // Return a minimal meta so Stremio still proceeds to stream
      return {
        meta: {
          id,
          type: 'movie',
          name: 'Unknown item',
          genres: ['Adult']
        }
      };
    }

    return {
      meta: {
        id: t.id,
        type: 'movie',
        name: t.name,
        poster: `https://via.placeholder.com/300x450/FF6B6B/FFFFFF?text=${encodeURIComponent(t.name.slice(0,10).replace(/[^\w]/g,''))}`,
        description: `💾 ${t.size} • 🌱 ${t.seeders} • 📥 ${t.leechers}`,
        genres: ['Adult'],
        releaseInfo: `${t.seeders} seeders`
      }
    };
  } catch (err) {
    console.error('❌ Meta error:', err);
    return { meta: null };
  }
});

// Stream handler
builder.defineStreamHandler(async ({ type, id }) => {
  console.log('🎬 ===== STREAM REQUEST RECEIVED =====');
  console.log('🎬 Stream request for ID:', id, 'Type:', type);
  if (type !== 'movie') return { streams: [] };

  try {
    await getCachedTorrents('trending'); // warm caches
    const all = [...trendingCache, ...popularCache];
    console.log(`🔍 Searching in ${all.length} total torrents`);
    console.log(`🆔 Looking for exact ID: ${id}`);

    const t = all.find(x => x.id === id);
    if (!t) {
      console.log('❌ Torrent not found for ID:', id);
      console.log(`🆔 Available IDs: ${all.slice(0,5).map(x => x.id).join(', ')}`);
      return { streams: [] };
    }

    console.log('✅ Found torrent:', t.name);
    console.log('🔗 Getting details from:', t.link);
    const details = await scraper.getTorrentDetails(t.link);

    if (!details || !details.magnetLink) {
      console.log('❌ No magnet link found for:', t.name);
      return { streams: [] };
    }

    console.log('🧲 Magnet link found! Creating streams...');
    const streams = [{
      title: `🔴 Direct P2P - ${t.size} (${t.seeders}S/${t.leechers}L)`,
      url: details.magnetLink,
      behaviorHints: { notWebReady: true, bingeGroup: 'adult-content' }
    }];

    console.log(`✅ Returning ${streams.length} streams for: ${t.name}`);
    console.log('🎬 ===== STREAM SUCCESS =====');
    return { streams };
  } catch (err) {
    console.error('❌ Stream error:', err);
    return { streams: [] };
  }
});

// Serve HTTP
const port = process.env.PORT || 3000;
serveHTTP(builder.getInterface(), { port, hostname: '0.0.0.0' });

console.log(`🚀 Adult Content Addon running on port ${port}`);
console.log('📋 Manifest: https://stremio.moindigital.in/manifest.json');
console.log('🎬 Install URL: stremio://stremio.moindigital.in/manifest.json');
console.log('🆔 ID Prefixes:', ID_PREFIXES.join(', '));
