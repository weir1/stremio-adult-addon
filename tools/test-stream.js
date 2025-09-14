const { getCachedTorrents } = require('../src/utils/torrentCache');
const Scraper1337x = require('../src/scrapers/1337x');

async function testStream(videoId) {
  if (!videoId) {
    console.error('❌ Error: Please provide a video ID.');
    process.exit(1);
  }

  console.log(`🔍 Testing stream for ID: ${videoId}...`);

  // Ensure cache is populated
  const trending = await getCachedTorrents('trending');
  const popular = await getCachedTorrents('popular');
  const allTorrents = [...trending, ...popular];

  const video = allTorrents.find(t => t.id === videoId);

  if (!video) {
    console.error(`❌ Error: Video with ID "${videoId}" not found in cache.`);
    return;
  }

  console.log(`✅ Found video: ${video.name}`);
  console.log(`➡️ Link: ${video.link}`);

  console.log('\n🔄 Simulating stream handler: Fetching torrent details...');
  const scraper = new Scraper1337x();
  const details = await scraper.getTorrentDetails(video.link);

  if (details && details.magnetLink) {
    console.log('\n🎉 SUCCESS! Magnet link found: \n');
    console.log(details.magnetLink);
  } else {
    console.error('\n❌ FAILURE: Could not retrieve magnet link.');
  }
}

const videoId = process.argv[2];
testStream(videoId);
