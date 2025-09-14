const Scraper1337x = require('../scrapers/1337x');


let trendingCache = [];
let popularCache = [];
let lastCacheUpdate = 0;
let isUpdating = false;
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

async function refreshCache(userConfig = {}) {
  if (isUpdating) return;
  isUpdating = true;
  console.log('🔄 Refreshing torrent cache in the background...');
  try {
    const Scraper1337x = require('../scrapers/1337x');
    const scraper = new Scraper1337x(userConfig);
    const [trending, popular] = await Promise.all([
      scraper.scrapeTrending(),
      scraper.scrapePopular()
    ]);
    trendingCache = trending;
    popularCache = popular;
    lastCacheUpdate = Date.now();
    console.log(`📦 Cache updated: ${trendingCache.length} trending, ${popularCache.length} popular`);
  } catch (error) {
    console.error('❌ Cache update failed:', error);
  } finally {
    isUpdating = false;
  }
}

function getCachedTorrents(kind, userConfig = {}) {
  const now = Date.now();
  if (!isUpdating && (now - lastCacheUpdate > CACHE_DURATION)) {
    refreshCache(userConfig); // Trigger background refresh, but don't wait for it
  }
  return kind === 'trending' ? trendingCache : popularCache;
}

function getTorrents() {
    return [...trendingCache, ...popularCache];
}

// Initial cache fill on startup
const initialCachePromise = refreshCache();

module.exports = { getCachedTorrents, getTorrents, refreshCache, initialCachePromise };
