const { getStreamUrl, isCached, getTorrentInfo } = require('../src/api/torbox');
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
      console.log('✅ Hash is cached in TorBox, attempting to get torrent info...');
      const torrent = await getTorrentInfo({ infoHash: TEST_INFO_HASH, token: TORBOX_API_KEY });

      if (torrent && torrent.files) {
        for (const file of torrent.files) {
          const streamResult = await getStreamUrl({ torrent: { ...torrent, files: [file] }, token: TORBOX_API_KEY });

          if (!streamResult.url) {
            console.error(`❌ getStreamUrl did not return a URL for file: ${file.name}`);
            continue;
          }

          console.log(`✅ getStreamUrl returned URL: ${streamResult.url} for file: ${file.name}`);
          console.log('🔍 Fetching the stream URL to check if it is playable...');

          const res = await request(streamResult.url, { method: 'GET' });

          console.log(`statusCode: ${res.statusCode}`);

          if (res.statusCode >= 200 && res.statusCode < 400) {
            console.log(`✅ TEST PASSED for file: ${file.name}. The stream URL returned a success status code.`);
          } else {
            console.error(`❌ TEST FAILED for file: ${file.name}. The stream URL returned a status code of ${res.statusCode}.`);
          }
        }
      } else {
        console.error('❌ Could not get torrent info or torrent has no files.');
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
