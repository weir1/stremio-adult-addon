const Scraper1337x = require('../scrapers/1337x');

const scraper = new Scraper1337x();
let trendingCache = [];
let popularCache = [];
let lastCacheUpdate = 0;
const CACHE_DURATION = 5 * 60 * 1000;

async function getCachedTorrents(kind) {
  const now = Date.now();
  if (now - lastCacheUpdate > CACHE_DURATION) {
    console.log('🔄 Refreshing torrent cache...');
    try {
      trendingCache = await scraper.scrapeTrending();
      popularCache = await scraper.scrapePopular();
      lastCacheUpdate = now;
      console.log(`📦 Cache updated: ${trendingCache.length} trending, ${popularCache.length} popular`);
      if (trendingCache.length) console.log('🆔 Sample trending IDs:', trendingCache.slice(0,3).map(t => t.id));
    } catch (error) {
      console.error('❌ Cache update failed:', error);
    }
  }
  return kind === 'trending' ? trendingCache : popularCache;
}

module.exports = { getCachedTorrents, trendingCache, popularCache };
