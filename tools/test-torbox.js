const TorBoxService = require('../src/services/torboxService');
const { extractInfoHash } = require('../src/api/torbox');

// =====================================================================================
// ⚠️ PLEASE REPLACE THESE VALUES with your actual TorBox API key and a known info hash ⚠️
// =====================================================================================
const TORBOX_API_KEY = '6de6dec9-68b5-43d3-98b6-e119b21daab3';
const CACHED_MAGNET_LINK = 'magnet:?xt=urn:btih:18b35734d97bb269adadc71370cedbfbf1b0ae54'; // <--- Hash from user, known to be cached
const UNCACHED_MAGNET_LINK = 'magnet:?xt=urn:btih:zmg56ugjkgjmdsd2d5r5o7j2dh36gitj'; // <--- Replace with a hash you know is NOT on TorBox
// =====================================================================================

async function testCached() {
  console.log('\n=================================\n');
  console.log('    Testing a CACHED torrent...   ');
  console.log('=================================\n');

  const infoHash = extractInfoHash(CACHED_MAGNET_LINK);
  const torboxService = new TorBoxService(TORBOX_API_KEY);
  const torrentInfo = { id: `test:${infoHash}`, name: 'Test Torrent', size: '1.2 GB' };

  try {
    const stream = await torboxService.processStream(CACHED_MAGNET_LINK, torrentInfo);
    console.log('✅ processStream response for cached torrent:', stream);

    if (!stream) {
      console.error('❌ TEST FAILED: processStream returned null or undefined.');
    } else if (stream.url && stream.title.includes('🟢 Cached')) {
      console.log('✅ TEST PASSED: Returned a cached stream URL with the correct title.');
    } else if (stream.title.includes('🔴 Error')) {
      console.error('❌ TEST FAILED: The service returned an error for a supposedly cached torrent.', stream.title);
    } else {
      console.error('❌ TEST FAILED: Returned an unexpected object for a cached torrent:', stream);
    }
  } catch (error) {
    console.error('❌ An error occurred during the cached test:', error);
  }
}

async function testUncached() {
  console.log('\n=================================\n');
  console.log('   Testing an UNCACHED torrent...  ');
  console.log('=================================\n');

  const infoHash = extractInfoHash(UNCACHED_MAGNET_LINK);
  const torboxService = new TorBoxService(TORBOX_API_KEY);
  const torrentInfo = { id: `test:${infoHash}`, name: 'Test Torrent', size: '500 MB' };

  try {
    const stream = await torboxService.processStream(UNCACHED_MAGNET_LINK, torrentInfo);
    console.log('✅ processStream response for uncached torrent:', stream);

    if (!stream) {
      console.error('❌ TEST FAILED: processStream returned null or undefined.');
    } else if (stream.externalUrl && stream.title.includes('🟡 Added to queue')) {
      console.log('✅ TEST PASSED: Returned an external URL for adding to the queue.');
    } else if (stream.title.includes('🔴 Error')) {
      console.error('❌ TEST FAILED: The service returned an error when trying to add a torrent.', stream.title);
    } else {
      console.error('❌ TEST FAILED: Returned an unexpected object for an uncached torrent:', stream);
    }
  } catch (error) {
    console.error('❌ An error occurred during the uncached test:', error);
  }
}

async function run() {
  if (TORBOX_API_KEY === 'YOUR_TORBOX_API_KEY') {
    console.error('❌ Please replace YOUR_TORBOX_API_KEY in tools/test-torbox.js with your TorBox API key.');
    return;
  }
  await testCached();
  await testUncached();
  console.log('\n🚀 All tests finished.');
}

run();