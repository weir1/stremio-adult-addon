const { isCached, addMagnet, getStreamUrl, extractInfoHash } = require('../api/torbox');

class TorBoxService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.statusStore = new Map();
  }

  setStatus(hash, payload) {
    const h = (hash || '').toLowerCase();
    this.statusStore.set(h, { ...payload, updatedAt: Date.now() });
  }

  getStatus(hash) {
    const h = (hash || '').toLowerCase();
    return this.statusStore.get(h) || { state: 'unknown', cached: false, progress: 0 };
  }

  async processStream(magnetLink, torrentInfo) {
    try {
      const infoHash = extractInfoHash(magnetLink);
      if (!infoHash) {
        console.log('❌ Could not extract info hash from magnet link');
        return null;
      }

      console.log(`🔍 Checking TorBox cache for hash: ${infoHash}`);

      // Check if torrent is already cached
      const cacheResult = await isCached({ 
        magnet: magnetLink, 
        infoHash: infoHash, 
        token: this.apiKey 
      });

      if (cacheResult.cached) {
        console.log('✅ Torrent is cached in TorBox');
        
        // Get stream URL
        const streamResult = await getStreamUrl({
          infoHash: infoHash,
          token: this.apiKey
        });

        if (streamResult.url) {
          this.setStatus(infoHash, {
            state: 'downloaded',
            cached: true,
            progress: 100,
            cachedUrl: streamResult.url
          });

          return {
            title: `🟢 TorBox Cached - ${torrentInfo.size} (Ready)`,
            url: streamResult.url,
            behaviorHints: { 
              notWebReady: false,
              bingeGroup: 'adult-content-torbox'
            }
          };
        }
      }

      // Torrent not cached, add to TorBox
      console.log('🟡 Adding torrent to TorBox...');
      const addResult = await addMagnet({
        magnet: magnetLink,
        token: this.apiKey
      });

      if (addResult.ok) {
        console.log('✅ Successfully added torrent to TorBox');
        this.setStatus(infoHash, {
          state: 'downloading',
          cached: false,
          progress: 0,
          cachedUrl: null
        });

        const host = process.env.PUBLIC_HOST || 'stremio.moindigital.in';
        return {
          title: '🟡 TorBox: Adding to queue... tap to refresh',
          externalUrl: `https://${host}/torbox-status/${infoHash}`,
          behaviorHints: { notWebReady: true }
        };
      } else {
        console.log('❌ Failed to add torrent to TorBox');
        return null;
      }

    } catch (error) {
      console.error('❌ TorBox service error:', error);
      return null;
    }
  }

  async checkTorrentStatus(infoHash) {
    try {
      const status = this.getStatus(infoHash);
      
      return {
        ok: true,
        hash: infoHash.toLowerCase(),
        state: status.state,
        cached: status.cached,
        progress: status.progress || 0,
        cachedUrl: status.cachedUrl || null,
        updatedAt: status.updatedAt || Date.now()
      };
    } catch (error) {
      console.error('❌ Error checking torrent status:', error);
      return {
        ok: false,
        hash: infoHash.toLowerCase(),
        state: 'error',
        cached: false,
        progress: 0,
        cachedUrl: null,
        updatedAt: Date.now()
      };
    }
  }
}

module.exports = TorBoxService;
