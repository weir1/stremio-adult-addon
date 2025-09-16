const { getCachedTorrents } = require('../utils/torrentCache');
const TorBoxService = require('../services/torboxService');
const FansDBService = require('../services/fansdbService');
const scraper = require('../scrapers/1337x');
const parseTorrent = require('parse-torrent');
const axios = require('axios');

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
        if (!t.magnetLink) continue;
        const parsed = parseTorrent(t.magnetLink);
        const files = parsed.files;

        if (files && files.length > 1) {
          for (const file of files) {
            const videoExtensions = ['.mp4', '.mkv', '.avi', '.wmv', '.mov'];
            if (videoExtensions.some(ext => file.name.endsWith(ext))) {
              const p2pStream = {
                name: 'P2P',
                title: `⚡️ P2P - ${file.name}`,
                url: t.magnetLink,
                behaviorHints: { notWebReady: true, bingeGroup: `fansdb-${sceneId}`, filename: file.name }
              };
              streams.push(p2pStream);

              if (userConfig?.enableTorBox && userConfig?.torboxApiKey) {
                const torboxService = new TorBoxService(userConfig.torboxApiKey);
                const torboxStream = await torboxService.processStream(t.magnetLink, t, file.name);
                if (torboxStream) streams.push(torboxStream);
              }
            }
          }
        } else {
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
      }

      return { streams };
    }
    
    if (type !== 'movie') return { streams: [] };
    
    try {
      const trending = getCachedTorrents('trending');
      const popular = getCachedTorrents('popular');
      const search = getCachedTorrents('search');
      const all = [...trending, ...popular, ...search];
      const t = all.find(x => x.id === id);
      
      if (!t) {
        console.log('❌ Could not find torrent in cache for ID:', id);
        return { streams: [] };
      }

      if (!t.magnetLink && t.torrentFileUrl) {
        console.log(`▶️ No magnet link for ${t.name}, downloading from ${t.torrentFileUrl}`);
        try {
            const response = await axios.get(t.torrentFileUrl, { responseType: 'arraybuffer', timeout: 20000 });
            const torrentFile = Buffer.from(response.data);
            const parsed = parseTorrent(torrentFile);
            t.magnetLink = parseTorrent.toMagnetURI(parsed);
            console.log(`✅ Magnet link generated for ${t.name}`);
        } catch (error) {
            console.error(`❌ Failed to download or parse .torrent file on-demand: ${error.message}`);
            return { streams: [{ name: "Error", title: "Failed to download torrent file", url: "#" }] };
        }
      }

      const magnetLink = t.magnetLink;

      if (!magnetLink) {
        console.log('❌ Could not find magnet link for torrent:', t.name);
        return { streams: [] };
      }

      const streams = [];
      const parsed = parseTorrent(magnetLink);
      const files = parsed.files;

      if (files && files.length > 1) {
        for (const file of files) {
          const videoExtensions = ['.mp4', '.mkv', '.avi', '.wmv', '.mov'];
          if (videoExtensions.some(ext => file.name.endsWith(ext))) {
            const p2pStream = {
              name: 'P2P',
              title: `⚡️ P2P - ${file.name}`,
              url: magnetLink,
              behaviorHints: { notWebReady: true, bingeGroup: 'adult-content', filename: file.name }
            };
            streams.push(p2pStream);

            if (userConfig?.enableTorBox && userConfig?.torboxApiKey) {
              console.log('🟡 TorBox integration enabled, processing...');
              const torboxService = new TorBoxService(userConfig.torboxApiKey);
              const torboxStream = await torboxService.processStream(magnetLink, t, file.name);
              
              console.log('🔍 TorBox stream result:', torboxStream);
              if (torboxStream) {
                streams.push(torboxStream);
                console.log('✅ TorBox stream added');
              }
            } else {
              console.log('🔘 TorBox disabled or no API key provided');
            }
          }
        }
      } else {
        const p2pStream = {
          name: 'P2P',
          title: `⚡️ P2P - ${t.size} (${t.seeders}S)`,
          url: magnetLink,
          behaviorHints: { notWebReady: true, bingeGroup: 'adult-content' }
        };
        streams.push(p2pStream);

        if (userConfig?.enableTorBox && userConfig?.torboxApiKey) {
          console.log('🟡 TorBox integration enabled, processing...');
          const torboxService = new TorBoxService(userConfig.torboxApiKey);
          const torboxStream = await torboxService.processStream(magnetLink, t);
          
          console.log('🔍 TorBox stream result:', torboxStream);
          if (torboxStream) {
            streams.push(torboxStream);
            console.log('✅ TorBox stream added');
          }
        } else {
          console.log('🔘 TorBox disabled or no API key provided');
        }
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
