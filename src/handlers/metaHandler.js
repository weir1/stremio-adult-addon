const { getCachedTorrents } = require('../utils/torrentCache');
const { generatePoster } = require('../utils/posterGenerator');
const FansDBService = require('../services/fansdbService');
const parseTorrent = require('parse-torrent');
const axios = require('axios');
const Scraper1337x = require('../scrapers/1337x');
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

      if (id.startsWith('x_') && !t.magnetLink) {
        const details = await scraper.getTorrentDetails(t.link);
        t.magnetLink = details.magnetLink;
        t.poster = details.poster;
      }

      let description = `💾 ${t.size} • 🌱 ${t.seeders} • 📥 ${t.leechers}`;
      let parsedTorrent;

      if (!t.magnetLink && t.torrentFileUrl) {
        try {
            const response = await axios.get(t.torrentFileUrl, { responseType: 'arraybuffer', timeout: 5000 });
            const torrentFile = Buffer.from(response.data);
            parsedTorrent = parseTorrent(torrentFile);
        } catch (error) {
            console.error(`❌ Failed to download .torrent file for meta: ${error.message}`);
        }
      } else if (t.magnetLink) {
        parsedTorrent = parseTorrent(t.magnetLink);
      }

      if (parsedTorrent && parsedTorrent.files) {
        const videoExtensions = ['.mp4', '.mkv', '.avi', '.wmv', '.mov'];
        const videoFiles = parsedTorrent.files.filter(f => videoExtensions.some(ext => f.name.endsWith(ext)));
        if (videoFiles.length > 1) {
          description += `\n\n🎬 Contains ${videoFiles.length} video files.`;
        }
      }

      return {
        meta: {
          id: t.id,
          type: 'movie',
          name: t.name,
          poster: await generatePoster(t.name, t, userConfig),
          description: description,
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

