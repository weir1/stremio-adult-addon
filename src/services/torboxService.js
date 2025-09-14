const { isCached, addMagnet, getStreamUrl, extractInfoHash } = require('../api/torbox');

class TorBoxService {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  async processStream(magnetLink, torrentInfo) {
    try {
      const infoHash = extractInfoHash(magnetLink);
      if (!infoHash) {
        console.log('❌ Could not extract info hash from magnet link');
        return null;
      }

      console.log(`⚡️ Processing stream for hash: ${infoHash}`);
      const status = await this.checkTorrentStatus(infoHash);

      if (status.cached && status.cachedUrl) {
        console.log('✅ Torrent is cached and ready to play');
        return {
          title: `🟢 TorBox Cached - ${torrentInfo.size} (Ready)`,
          url: status.cachedUrl,
          behaviorHints: { 
            notWebReady: false,
            bingeGroup: 'adult-content-torbox'
          }
        };
      }

      if (status.state === 'downloading' || status.state === 'queued') {
        console.log('🟡 Torrent is downloading in TorBox');
        const host = process.env.PUBLIC_HOST || 'stremio.moindigital.in';
        return {
          title: `🟡 TorBox: ${status.progress}% - Tap to refresh`,
          externalUrl: `https://${host}/torbox-status/${infoHash}?api_key=${this.apiKey}`,
          behaviorHints: { notWebReady: true }
        };
      }

      // If not cached or downloading, add it
      console.log('➕ Torrent not in TorBox, adding now...');
      const addResult = await addMagnet({ magnet: magnetLink, token: this.apiKey });

      if (addResult.ok) {
        console.log('✅ Successfully added torrent to TorBox queue');
        const host = process.env.PUBLIC_HOST || 'stremio.moindigital.in';
        return {
          title: '🟡 TorBox: Added to queue! Tap to refresh',
          externalUrl: `https://${host}/torbox-status/${infoHash}?api_key=${this.apiKey}`,
          behaviorHints: { notWebReady: true }
        };
      } else {
        console.log('❌ Failed to add torrent to TorBox');
        return {
          title: '🔴 TorBox: Error adding torrent',
          url: '#',
          behaviorHints: { notWebReady: true }
        };
      }

    } catch (error) {
      console.error('❌ TorBox service error:', error);
      return null;
    }
  }

  async checkTorrentStatus(infoHash) {
    const h = (infoHash || '').toLowerCase();
    console.log(`🔎 Checking real-time TorBox status for hash: ${h}`);

    try {
      const cacheResult = await isCached({ infoHash: h, token: this.apiKey });

      if (cacheResult.cached) {
        console.log('✅ Hash is cached in TorBox, fetching stream URL...');
        const streamResult = await getStreamUrl({ infoHash: h, token: this.apiKey });

        if (streamResult.url) {
          return {
            ok: true,
            hash: h,
            state: 'downloaded',
            cached: true,
            progress: 100,
            cachedUrl: streamResult.url,
            updatedAt: Date.now()
          };
        }
      }
      
      // If not cached, assume it's downloading or queued
      // TorBox API doesn't give progress, so we reflect a generic state
      console.log('🟡 Hash not cached, assuming it is downloading/queued');
      return {
        ok: true,
        hash: h,
        state: 'downloading', // Generic state
        cached: false,
        progress: 50, // Placeholder progress
        cachedUrl: null,
        updatedAt: Date.now(),
        message: 'Torrent is being processed by TorBox. Refresh to check again.'
      };

    } catch (error) { 
      console.error('❌ Error in checkTorrentStatus:', error);
      return {
        ok: false,
        hash: h,
        state: 'error',
        cached: false,
        progress: 0,
        cachedUrl: null,
        updatedAt: Date.now(),
        error: 'Failed to query TorBox API'
      };
    }
  }
}

module.exports = TorBoxService;
