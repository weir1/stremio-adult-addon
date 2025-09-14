const { getCachedTorrents } = require('../utils/torrentCache');
const { generatePoster } = require('../utils/posterGenerator');
const FansDBService = require('../services/fansdbService');

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
      const all = [...trending, ...popular];
      const t = all.find(x => x.id === id);
      
      if (!t) {
        return { meta: { id, type: 'movie', name: 'Unknown item', genres: ['Adult'] } };
      }

      return {
        meta: {
          id: t.id,
          type: 'movie',
          name: t.name,
          poster: await generatePoster(t.name, t, userConfig),
          description: `💾 ${t.size} • 🌱 ${t.seeders} • 📥 ${t.leechers}`,
          genres: ['Adult'],
          releaseInfo: `${t.seeders} seeders`,
          imdbRating: '6.5'
        }
      };
    } catch (err) {
      console.error('❌ Meta error:', err);
      return { meta: null };
    }
  }
}

module.exports = new MetaHandler();
