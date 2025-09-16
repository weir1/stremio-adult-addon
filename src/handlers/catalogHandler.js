const { getCachedTorrents, setCachedTorrents, initialCachePromise } = require('../utils/torrentCache');
const { generatePoster } = require('../utils/posterGenerator');
const FansDBService = require('../services/fansdbService');

class CatalogHandler {
  async handle({ type, id, extra }, userConfig) {
    console.log('📋 Catalog request:', { type, id, extra });
    console.log('🔧 User config for catalog:', userConfig);
    if (type !== 'movie' && type !== 'channel') return { metas: [] };

    // FansDB Catalog
    if (id === 'fansdb-top') {
      if (userConfig?.fansdbApiKey) {
        const fansdbService = new FansDBService(userConfig.fansdbApiKey);
        const performers = await fansdbService.getTopPerformers();
        return { metas: performers };
      } else {
        return { metas: [] }; // No API key, no catalog
      }
    }
    
    try {
      let torrents = [];
      if (id === 'adult-search') {
        if (extra && extra.search) {
          if (userConfig.jackettUrl && userConfig.jackettApiKey) {
            const ScraperJackett = require('../scrapers/jackett');
            const scraper = new ScraperJackett(userConfig);
            torrents = await scraper.search(extra.search);
          } else {
            const Scraper1337x = require('../scrapers/1337x');
            const scraper = new Scraper1337x(userConfig);
            torrents = await scraper.search(extra.search);
          }
          if (torrents.length > 0) {
            setCachedTorrents('search', torrents);
          }
        }
      } else {
        await initialCachePromise;
        if (id === 'adult-trending') torrents = getCachedTorrents('trending', userConfig);
        else if (id === 'adult-popular') torrents = getCachedTorrents('popular', userConfig);
      }
      
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

      const skip = extra.skip || 0;
      const paginatedTorrents = torrents.slice(skip);

      const isSearch = id === 'adult-search';

      // Generate posters for all torrents with user config
      console.log('🖼️ Generating posters with ThePornDB integration...');
      const metas = await Promise.all(paginatedTorrents.map(async (t) => ({
        id: t.id,
        type: 'movie',
        name: t.name.length > 80 ? t.name.slice(0,80) + '...' : t.name,
        poster: isSearch ? 'https://via.placeholder.com/300x450/FF6B6B/FFFFFF?text=Loading...' : await generatePoster(t.name, t, userConfig),
        description: `💾 Size: ${t.size}\n🌱 Seeders: ${t.seeders}\n📥 Leechers: ${t.leechers}${t.uploader ? `\n👤 Uploader: ${t.uploader}` : ''}`,
        genres: ['Adult'],
        releaseInfo: `${t.seeders} seeders`
      })));

      console.log(`✅ Returning catalog metas: ${metas.length}`);
      return { metas };
    } catch (err) {
      console.error('❌ Catalog error:', err);
      return { metas: [] };
    }
  }
}

module.exports = new CatalogHandler();

