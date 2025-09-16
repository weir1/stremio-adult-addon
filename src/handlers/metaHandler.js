const { getCachedTorrents } = require('../utils/torrentCache');
const { generatePoster } = require('../utils/posterGenerator');
const FansDBService = require('../services/fansdbService');
const Scraper1337x = require('../scrapers/1337x');
const scraper = new Scraper1337x();

class MetaHandler {
  async handle({ type, id }, userConfig) {
    console.log('🧾 Meta request:', { type, id });

    if (id.startsWith('fansdb:')) {
      if (userConfig?.fansdbApiKey) {
        const fansdbService = new FansDBService(userConfig.fansdbApiKey);
        const performerId = id.split(':')[1];
        const meta = await fansdbService.getPerformerMeta(performerId);
        return { meta };
      } else {
        return { meta: null };
      }
    }

    if (type !== 'movie') return { meta: null };
    
    try {
      const trending = await getCachedTorrents('trending');
      const popular = await getCachedTorrents('popular');
      const search = await getCachedTorrents('search');
      const all = [...trending, ...popular, ...search];
      const t = all.find(x => x.id === id);
      
      if (!t) {
        return { meta: { id, type: 'movie', name: 'Unknown item', genres: ['Adult'] } };
      }

      if (id.startsWith('x_') && !t.poster) {
        console.log(`🖼️ 1337x item "${t.name}" is missing a poster. Fetching details...`);
        const details = await scraper.getTorrentDetails(t.link);
        if (details.poster) {
          t.poster = details.poster;
          console.log(`  ✅ Found poster: ${details.poster}`);
        } else {
          console.log(`  🟡 No poster found on details page.`);
        }
      }

      const description = `💾 ${t.size} • 🌱 ${t.seeders} • 📥 ${t.leechers}`;
      const posterData = await generatePoster(t.name, t, userConfig);

      const meta = {
        id: t.id,
        type: 'movie',
        name: t.name,
        poster: posterData.poster,
        description: description,
        genres: ['Adult'],
        releaseInfo: `${t.seeders} seeders`,
      };

      if (posterData.rating) {
        meta.imdbRating = posterData.rating.toFixed(1);
      }

      return { meta };
    } catch (err) {
      console.error('❌ Meta error:', err);
      return { meta: null };
    }
  }
}

module.exports = new MetaHandler();
