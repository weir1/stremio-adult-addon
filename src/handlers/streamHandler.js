const { getCachedTorrents } = require('../utils/torrentCache');
const TorBoxService = require('../services/torboxService');
const FansDBService = require('../services/fansdbService');
const scraper = require('../scrapers/1337x');

class StreamHandler {
  async handle({ type, id }, userConfig) {
    console.log('🎬 ===== STREAM REQUEST RECEIVED =====');
    console.log('🎬 Stream request for ID:', id, 'Type:', type);
    console.log('⚙️ User Config:', userConfig);

    if (id.startsWith('fansdb-scene:')) {
      if (!userConfig?.fansdbApiKey) return { streams: [] };

      const fansdbService = new FansDBService(userConfig.fansdbApiKey);
      const [, performerId, sceneId] = id.split(':');

      const performerMeta = await fansdbService.getPerformerMeta(performerId);
      const scene = performerMeta?.videos?.find(v => v.id === id);

      if (!scene?.title) {
        console.log('❌ Could not find scene title for ID:', id);
        return { streams: [] };
      }

      const torrents = await scraper.search(scene.title);
      if (!torrents.length) {
        console.log('❌ No torrents found for:', scene.title);
        return { streams: [] };
      }

      const streams = [];
      for (const t of torrents) {
        const p2pStream = {
          name: 'P2P',
          title: `⚡️ P2P - ${t.size} (${t.seeders}S)`,
          url: t.magnetLink,
          behaviorHints: { notWebReady: true, bingeGroup: `fansdb-${sceneId}` }
        };
        streams.push(p2pStream);

        if (userConfig?.enableTorBox && userConfig?.torboxApiKey) {
          const torboxService = new TorBoxService(userConfig.torboxApiKey);
          const torboxStream = await torboxService.processStream(t.magnetLink, t);
          if (torboxStream) streams.push(torboxStream);
        }
      }

      return { streams };
    }
    
    if (type !== 'movie') return { streams: [] };
    
    try {
      const trending = await getCachedTorrents('trending');
      const popular = await getCachedTorrents('popular');
      const all = [...trending, ...popular];
      const t = all.find(x => x.id === id);
      
      if (!t || !t.magnetLink) {
        console.log('❌ Could not find torrent or magnet link in cache for ID:', id);
        return { streams: [] };
      }

      const streams = [];
      
      const p2pStream = {
        name: 'P2P',
        title: `⚡️ P2P - ${t.size} (${t.seeders}S)`,
        url: t.magnetLink,
        behaviorHints: { notWebReady: true, bingeGroup: 'adult-content' }
      };
      streams.push(p2pStream);

      if (userConfig?.enableTorBox && userConfig?.torboxApiKey) {
        console.log('🟡 TorBox integration enabled, processing...');
        const torboxService = new TorBoxService(userConfig.torboxApiKey);
        const torboxStream = await torboxService.processStream(t.magnetLink, t);
        
        console.log('🔍 TorBox stream result:', torboxStream);
        if (torboxStream) {
          streams.push(torboxStream);
          console.log('✅ TorBox stream added');
        }
      } else {
        console.log('🔘 TorBox disabled or no API key provided');
      }

      console.log(`✅ Returning ${streams.length} streams for: ${t.name}`);
      console.log('🎬 ===== STREAM SUCCESS =====');
      return { streams };
    } catch (err) {
      console.error('❌ Stream error:', err);
      return { streams: [] };
    }
  }
}

module.exports = new StreamHandler();
