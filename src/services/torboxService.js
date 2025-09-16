const { isCached, addMagnet, getStreamUrl, extractInfoHash, getTorrentInfo } = require('../api/torbox');

class TorBoxService {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  async processStream(magnetLink, torrentInfo, filename = null) {
    try {
      const infoHash = extractInfoHash(magnetLink);
      if (!infoHash) {
        console.log('❌ Could not extract info hash from magnet link');
        return null;
      }

      console.log(`⚡️ Processing stream for hash: ${infoHash}`);
      const status = await this.checkTorrentStatus(infoHash, filename);

      if (!status.ok) {
        return {
          name: 'TorBox',
          title: '🔴 Error: Check Status Failed',
          url: '#',
          behaviorHints: { notWebReady: true }
        };
      }

      if (status.cached && status.cachedUrl) {
        console.log('✅ Torrent is cached and ready to play');
        return {
          name: 'TorBox',
          title: `🟢 Cached - ${torrentInfo.size}`,
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
          name: 'TorBox',
          title: `🟡 Downloading... (${status.progress}%)`,
          externalUrl: `https://${host}/torbox-status/${infoHash}?api_key=${this.apiKey}`,
          behaviorHints: { notWebReady: true }
        };
      }

      if (status.state === 'not_found') {
        console.log('➕ Torrent not in TorBox, adding now...');
        const addResult = await addMagnet({ magnet: magnetLink, token: this.apiKey });

        if (addResult.ok) {
          console.log('✅ Successfully added torrent to TorBox queue');
          const host = process.env.PUBLIC_HOST || 'stremio.moindigital.in';
          return {
            name: 'TorBox',
            title: '🟡 Added to queue! Refresh...',
            externalUrl: `https://${host}/torbox-status/${infoHash}?api_key=${this.apiKey}`,
            behaviorHints: { notWebReady: true }
          };
        } else {
          console.log('❌ Failed to add torrent to TorBox');
          return {
            name: 'TorBox',
            title: '🔴 Error: Failed to Add',
            url: '#',
            behaviorHints: { notWebReady: true }
          };
        }
      }
      
      return {
        name: 'TorBox',
        title: '🔴 Error: Unknown Status',
        url: '#',
        behaviorHints: { notWebReady: true }
      };

    } catch (error) {
      console.error('❌ TorBox service error:', error);
      return null;
    }
  }

  async checkTorrentStatus(infoHash, filename = null) {
    const h = (infoHash || '').toLowerCase();
    console.log(`🔎 Checking real-time TorBox status for hash: ${h}`);

    try {
      const cacheResult = await isCached({ infoHash: h, token: this.apiKey });

      if (cacheResult.cached) {
        console.log('✅ Hash is cached in TorBox, attempting to get torrent info...');
        let torrent = await getTorrentInfo({ infoHash: h, token: this.apiKey });

        if (!torrent) {
          console.log('🟡 Torrent is cached but not in mylist, adding it now...');
          await addMagnet({ magnet: `magnet:?xt=urn:btih:${h}`, token: this.apiKey });
          
          let retries = 3;
          while (!torrent && retries > 0) {
              console.log(`Retrying to get torrent info... (${4 - retries})`);
              await new Promise(resolve => setTimeout(resolve, 2000)); // 2-second delay
              torrent = await getTorrentInfo({ infoHash: h, token: this.apiKey });
              retries--;
          }
        }

        if (torrent) {
          const streamResult = await getStreamUrl({ torrent, token: this.apiKey, filename });

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
        
        console.error('❌ Failed to get stream URL, even though file is cached.');
        return {
          ok: false,
          hash: h,
          state: 'error',
          cached: true,
          progress: 100,
          cachedUrl: null,
          updatedAt: Date.now(),
          error: 'Could not retrieve stream URL for cached file.'
        };
      }
      
      console.log('🟡 Hash not found in TorBox cache.');
      return {
        ok: true,
        hash: h,
        state: 'not_found',
        cached: false,
        progress: 0,
        cachedUrl: null,
        updatedAt: Date.now()
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