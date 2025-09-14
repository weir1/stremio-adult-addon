const { processStream } = require('../src/services/torboxService');

// =====================================================================================
// ⚠️ REPLACE THIS with your real API key and known cached/uncached magnets ⚠️
// =====================================================================================
const TORBOX_API_KEY = '6de6dec9-68b5-43d3-98b6-e119b21daab3';
const CACHED_MAGNET_LINK =
  'magnet:?xt=urn:btih:18b35734d97bb269adadc71370cedbfbf1b0ae54'; // known cached
const UNCACHED_MAGNET_LINK =
  'magnet:?xt=urn:btih:zmg56ugjkgjmdsd2d5r5o7j2dh36gitj'; // known uncached
// =====================================================================================

async function testCached() {
  console.log('\n=================================\n');
  console.log('    Testing a CACHED torrent...   ');
  console.log('=================================\n');

  try {
    const result = await processStream(CACHED_MAGNET_LINK);
    console.log('🔎 Raw cached test response:', JSON.stringify(result, null, 2));

    if (!result) {
      console.error('❌ TEST FAILED: processStream returned null/undefined.');
    } else if (result.status === 'cached') {
      console.log('✅ TEST PASSED: Returned a cached status.');
    } else if (result.status === 'error') {
      console.error(
        '❌ TEST FAILED: The service returned an error for a supposedly cached torrent:',
        result.error
      );
    } else {
      console.error('❌ TEST FAILED: Unexpected object for cached torrent:', result);
    }
  } catch (err) {
    console.error('❌ Exception during cached test:', err);
  }
}

async function testUncached() {
  console.log('\n=================================\n');
  console.log('   Testing an UNCACHED torrent...  ');
  console.log('=================================\n');

  try {
    const result = await processStream(UNCACHED_MAGNET_LINK);
    console.log('🔎 Raw uncached test response:', JSON.stringify(result, null, 2));

    if (!result) {
      console.error('❌ TEST FAILED: processStream returned null/undefined.');
    } else if (result.status === 'added') {
      console.log('✅ TEST PASSED: Returned an added status.');
    } else if (result.status === 'error') {
      console.error(
        '❌ TEST FAILED: The service returned an error when trying to add a torrent:',
        result.error
      );
    } else {
      console.error('❌ TEST FAILED: Unexpected object for uncached torrent:', result);
    }
  } catch (err) {
    console.error('❌ Exception during uncached test:', err);
  }
}

async function run() {
  if (TORBOX_API_KEY === 'YOUR_TORBOX_API_KEY') {
    console.error('❌ Please set TORBOX_API_KEY in tools/test-torbox.js');
    return;
  }

  process.env.TORBOX_API_KEY = TORBOX_API_KEY;

  await testCached();
  await testUncached();

  console.log('\n🚀 All tests finished.\n');
}

run();
