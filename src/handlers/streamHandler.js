const { getCachedTorrents } = require('../utils/torrentCache');
const TorBoxService = require('../services/torboxService');

class StreamHandler {
  async handle({ type, id }, userConfig) {
    console.log('🎬 ===== STREAM REQUEST RECEIVED =====');
    console.log('🎬 Stream request for ID:', id, 'Type:', type);
    console.log('⚙️ User Config:', userConfig);
    
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
      
      // Always provide P2P stream from cached magnet link
      const p2pStream = {
        title: `🔴 P2P - ${t.size} (${t.seeders}S)`,
        url: t.magnetLink,
        behaviorHints: { notWebReady: true, bingeGroup: 'adult-content' }
      };
      streams.push(p2pStream);

      // Add TorBox stream if configured
      if (userConfig?.enableTorBox && userConfig?.torboxApiKey) {
        console.log('🟡 TorBox integration enabled, processing...');
        const torboxService = new TorBoxService(userConfig.torboxApiKey);
        const torboxStream = await torboxService.processStream(t.magnetLink, t);
        
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
