const { getStreamUrl } = require('../src/api/torbox');
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
    const streamResult = await getStreamUrl({ infoHash: TEST_INFO_HASH, token: TORBOX_API_KEY });

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

  } catch (error) {
    console.error('❌ An error occurred during the test:', error);
  }

  console.log('\n🚀 Test finished.');
}

runTest();
