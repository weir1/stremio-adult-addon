const { getCachedTorrents } = require('../src/utils/torrentCache');
const Scraper1337x = require('../src/scrapers/1337x');

// Function to introduce a delay
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function bulkTestStreams() {
  console.log('🚀 Starting bulk stream test...');

  // Ensure cache is populated
  const trending = await getCachedTorrents('trending');
  const popular = await getCachedTorrents('popular');
  const allTorrents = [...trending, ...popular];

  if (allTorrents.length === 0) {
    console.log('No videos found to test.');
    return;
  }

  console.log(`Found ${allTorrents.length} total videos to test.\n`);

  const scraper = new Scraper1337x();
  let successCount = 0;
  let failureCount = 0;

  for (let i = 0; i < allTorrents.length; i++) {
    const video = allTorrents[i];
    console.log(`[${i + 1}/${allTorrents.length}] Testing: ${video.name.substring(0, 50)}... (ID: ${video.id})`);

    const details = await scraper.getTorrentDetails(video.link);

    if (details && details.magnetLink) {
      console.log('  └─ ✅ SUCCESS: Magnet link found.\n');
      successCount++;
    } else {
      console.log(`  └─ ❌ FAILURE: Could not retrieve magnet link for ${video.link}\n`);
      failureCount++;
    }

    // Add a small delay to avoid overwhelming the server
    await sleep(250);
  }

  console.log('\n--- 🏁 Test Complete ---');
  console.log(`Total Videos Tested: ${allTorrents.length}`);
  console.log(`✅ Successes: ${successCount}`);
  console.log(`❌ Failures: ${failureCount}`);
}

bulkTestStreams();
