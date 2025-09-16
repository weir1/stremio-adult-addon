const { getCachedTorrents } = require('../utils/torrentCache');
const TorBoxService = require('../services/torboxService');
const FansDBService = require('../services/fansdbService');
const Scraper1337x = require('../scrapers/1337x');
const scraper = new Scraper1337x();
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
      const torboxService = userConfig?.enableTorBox && userConfig?.torboxApiKey
        ? new TorBoxService(userConfig.torboxApiKey)
        : null;

      for (const t of torrents) {
        if (!t.magnetLink) continue;
        
        let parsed;
        try {
          parsed = parseTorrent(t.magnetLink);
        } catch (e) {
          console.error(`❌ Failed to parse magnet link: ${e.message}`);
          continue;
        }

        const files = parsed.files || [];
        if (files.length > 1) {
          files.forEach((file, fileIndex) => {
            const videoExtensions = ['.mp4', '.mkv', '.avi', '.wmv', '.mov'];
            if (videoExtensions.some(ext => file.name.toLowerCase().endsWith(ext))) {
              streams.push({
                name: 'P2P',
                title: `⚡️ P2P - ${file.name}`,
                infoHash: parsed.infoHash,
                fileIdx: fileIndex,
                announce: parsed.announce,
                behaviorHints: { bingeGroup: `p2p-${parsed.infoHash}` }
              });

              if (torboxService) {
                torboxService.processStream(t.magnetLink, t, file.name).then(torboxStream => {
                  if (torboxStream) streams.push(torboxStream);
                });
              }
            }
          });
        } else {
          streams.push({
            name: 'P2P',
            title: `⚡️ P2P - ${t.size} (${t.seeders || 0}S)`,
            infoHash: parsed.infoHash,
            announce: parsed.announce,
            behaviorHints: { bingeGroup: `p2p-${parsed.infoHash}` }
          });

          if (torboxService) {
            torboxService.processStream(t.magnetLink, t).then(torboxStream => {
              if (torboxStream) streams.push(torboxStream);
            });
          }
        }
      }
      // Await all promises from torboxService
      await new Promise(resolve => setTimeout(resolve, 1000)); // Give some time for promises to be added
      const promises = streams.filter(s => s instanceof Promise);
      await Promise.all(promises);

      return { streams: streams.filter(s => !(s instanceof Promise)) };
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

      // Universal magnet link handling
      if (!t.magnetLink) {
        if (id.startsWith('x_')) { // 1337x
          console.log(`▶️ No magnet link for 1337x torrent: ${t.name}, scraping details...`);
          const details = await scraper.getTorrentDetails(t.link);
          t.magnetLink = details.magnetLink;
        } else if (t.torrentFileUrl) { // Jackett
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
      }

      if (!t.magnetLink) {
        console.log('❌ Could not get magnet link for torrent:', t.name);
        return { streams: [] };
      }

      const magnetLink = t.magnetLink;
      let parsedTorrent;
      try {
        parsedTorrent = parseTorrent(magnetLink);
      } catch (e) {
        console.error(`❌ Failed to parse magnet link: ${e.message}`);
        return { streams: [] };
      }
      
      const streams = [];
      const files = parsedTorrent.files || [];
      const videoExtensions = ['.mp4', '.mkv', '.avi', '.wmv', '.mov'];

      const torboxService = userConfig?.enableTorBox && userConfig?.torboxApiKey
        ? new TorBoxService(userConfig.torboxApiKey)
        : null;

      if (files.length > 1) {
        console.log(`Found ${files.length} video files in torrent: ${t.name}`);
        files.forEach((file, fileIndex) => {
          if (videoExtensions.some(ext => file.name.toLowerCase().endsWith(ext))) {
            streams.push({
              name: 'P2P',
              title: `⚡️ P2P - ${file.name}`,
              infoHash: parsedTorrent.infoHash,
              fileIdx: fileIndex,
              announce: parsedTorrent.announce,
              behaviorHints: { bingeGroup: `p2p-${parsedTorrent.infoHash}` }
            });

            if (torboxService) {
              torboxService.processStream(magnetLink, t, file.name).then(torboxStream => {
                if (torboxStream) streams.push(torboxStream);
              });
            }
          }
        });
      } else {
        streams.push({
          name: 'P2P',
          title: `⚡️ P2P - ${t.size} (${t.seeders || 0}S)`,
          infoHash: parsedTorrent.infoHash,
          announce: parsedTorrent.announce,
          behaviorHints: { bingeGroup: `p2p-${parsedTorrent.infoHash}` }
        });

        if (torboxService) {
          torboxService.processStream(magnetLink, t).then(torboxStream => {
            if (torboxStream) streams.push(torboxStream);
          });
        }
      }

      // Await all promises from torboxService
      await new Promise(resolve => setTimeout(resolve, 1000)); // Give some time for promises to be added
      const promises = streams.filter(s => s instanceof Promise);
      await Promise.all(promises);

      const finalStreams = streams.filter(s => !(s instanceof Promise));

      console.log(`✅ Returning ${finalStreams.length} streams for: ${t.name}`);
      console.log('🎬 ===== STREAM SUCCESS =====');
      return { streams: finalStreams };
    } catch (err) {
      console.error('❌ Stream error:', err);
      return { streams: [] };
    }
  }
}

module.exports = new StreamHandler();