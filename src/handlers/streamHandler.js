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
      // This logic needs to be updated to match the movie logic for correctness
      return { streams: [] }; // Temporarily disable to avoid bugs
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

      let parsedTorrent;
      console.log(`ℹ️ Stream request for "${t.name}"`);
      console.log(`  • Seeders: ${t.seeders}, Leechers: ${t.leechers}`);
      if (t.seeders === 0) {
        console.log('  ⚠️ Warning: Torrent has 0 seeders and may be dead.');
      }

      // Universal magnet link handling
      if (!t.magnetLink) {
        if (id.startsWith('x_')) { // 1337x
          console.log('  ℹ️ No magnet link found, fetching from 1337x details page...');
          const details = await scraper.getTorrentDetails(t.link);
          t.magnetLink = details.magnetLink;
        } else if (t.torrentFileUrl) { // Jackett
          console.log('  ℹ️ No magnet link found, downloading .torrent file from Jackett...');
          try {
            const response = await axios.get(t.torrentFileUrl, { responseType: 'arraybuffer', timeout: 20000 });
            const torrentFile = Buffer.from(response.data);
            parsedTorrent = parseTorrent(torrentFile);
            t.magnetLink = parseTorrent.toMagnetURI(parsedTorrent);
            console.log('  ✅ Magnet link generated successfully from Jackett link.');
          } catch (error) {
            if (error.response && error.response.status === 404) {
              console.log('  ⚠️ Jackett download link failed (404). Trying fallback with GUID URL...');
              if (t.id.startsWith('js_http')) {
                const guidUrl = t.id.substring(3);
                try {
                  const fallbackResponse = await axios.get(guidUrl, { responseType: 'arraybuffer', timeout: 20000 });
                  const torrentFile = Buffer.from(fallbackResponse.data);
                  parsedTorrent = parseTorrent(torrentFile);
                  t.magnetLink = parseTorrent.toMagnetURI(parsedTorrent);
                  console.log('  ✅ Magnet link generated successfully from GUID fallback.');
                } catch (fallbackError) {
                  console.error(`  ❌ Fallback download from GUID failed: ${fallbackError.message}`);
                  return { streams: [{ name: "Error", title: "Failed to download torrent file", url: "#" }] };
                }
              } else {
                  console.error(`  ❌ Jackett download failed and no GUID URL fallback available: ${error.message}`);
                  return { streams: [{ name: "Error", title: "Failed to download torrent file", url: "#" }] };
              }
            } else {
              console.error(`  ❌ Failed to download or parse .torrent file: ${error.message}`);
              return { streams: [{ name: "Error", title: "Failed to download torrent file", url: "#" }] };
            }
          }
        }
      }

      if (!t.magnetLink) {
        console.log('  ❌ Could not get magnet link for torrent. No streams will be provided.');
        return { streams: [] };
      }
      console.log('  ✅ Magnet link available.');

      const magnetLink = t.magnetLink;
      if (!parsedTorrent) {
        try {
          parsedTorrent = parseTorrent(magnetLink);
        } catch (e) {
          console.error(`  ❌ Failed to parse magnet link: ${e.message}`);
          return { streams: [] };
        }
      }
      
      const streams = [];
      const files = parsedTorrent.files || [];
      const videoExtensions = ['.mp4', '.mkv', '.avi', '.wmv', '.mov'];
      const torboxService = userConfig?.enableTorBox && userConfig?.torboxApiKey ? new TorBoxService(userConfig.torboxApiKey) : null;
      const videoFiles = files.filter(f => videoExtensions.some(ext => f.name.toLowerCase().endsWith(ext)));

      if (videoFiles.length > 1) {
        console.log(`  ℹ️ Found ${videoFiles.length} video files in torrent. Creating a stream for each.`);
        videoFiles.forEach(file => {
          const fileIndex = files.findIndex(f => f.path === file.path);
          streams.push({
            name: 'P2P',
            title: `⚡️ P2P - ${file.name}`,
            infoHash: parsedTorrent.infoHash,
            fileIdx: fileIndex,
            announce: parsedTorrent.announce,
            behaviorHints: { bingeGroup: `p2p-${parsedTorrent.infoHash}` }
          });
        });

        if (torboxService) {
          console.log('  ℹ️ TorBox is enabled. Processing streams sequentially to avoid rate limits...');
          for (const file of videoFiles) {
            const torboxStream = await torboxService.processStream(magnetLink, t, file.name);
            if (torboxStream) {
              streams.push(torboxStream);
            }
          }
        }

      } else {
        console.log('  ℹ️ Found a single video file or no video files. Creating a single stream.');
        const fileIndex = videoFiles.length === 1 ? files.findIndex(f => f.path === videoFiles[0].path) : undefined;
        streams.push({
          name: 'P2P',
          title: `⚡️ P2P - ${t.size} (${t.seeders || 0}S)`,
          infoHash: parsedTorrent.infoHash,
          fileIdx: fileIndex,
          announce: parsedTorrent.announce,
          behaviorHints: { bingeGroup: `p2p-${parsedTorrent.infoHash}` }
        });

        if (torboxService) {
          console.log('  ℹ️ TorBox is enabled. Processing stream...');
          const torboxStream = await torboxService.processStream(magnetLink, t);
          if (torboxStream) streams.push(torboxStream);
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
