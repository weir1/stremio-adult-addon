const { getStreamUrl, isCached, getTorrentId } = require('../src/api/torbox');
const { request } = require('undici');

// =====================================================================================
const TORBOX_API_KEY = '6de6dec9-68b5-43d3-98b6-e119b21daab3';
const TEST_INFO_HASH = '18b35734d97bb269adadc71370cedbfbf1b0ae54'; // Hash from user, known to be cached
// =====================================================================================

async function runTest() {
  if (!TORBOX_API_KEY) {
    console.error('❌ TorBox API key is missing.');
    return;
  }

  console.log(`🚀 Starting TorBox playback test for info hash: ${TEST_INFO_HASH}`);

  try {
    const cacheResult = await isCached({ infoHash: TEST_INFO_HASH, token: TORBOX_API_KEY });

    if (cacheResult.cached) {
      console.log('✅ Hash is cached in TorBox, attempting to get torrent ID...');
      const torrentId = await getTorrentId({ infoHash: TEST_INFO_HASH, token: TORBOX_API_KEY });

      if (torrentId) {
        const streamResult = await getStreamUrl({ torrentId, infoHash: TEST_INFO_HASH, token: TORBOX_API_KEY });

        if (!streamResult.url) {
          console.error('❌ getStreamUrl did not return a URL.');
          return;
        }

        console.log(`✅ getStreamUrl returned URL: ${streamResult.url}`);
        console.log('🔍 Fetching the stream URL to check if it is playable...');

        const res = await request(streamResult.url, { method: 'GET' });

        console.log(`statusCode: ${res.statusCode}`);

        if (res.statusCode === 200) {
          console.log('✅ TEST PASSED: The stream URL returned a 200 OK status.');
        } else {
          console.error('❌ TEST FAILED: The stream URL did not return a 200 OK status.');
        }
      } else {
        console.error('❌ Could not get torrent ID.');
      }
    } else {
      console.error('❌ Torrent is not cached.');
    }

  } catch (error) {
    console.error('❌ An error occurred during the test:', error);
  }

  console.log('\n🚀 Test finished.');
}

runTest();