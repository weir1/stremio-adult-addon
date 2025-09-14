const { getCachedTorrents } = require('../src/utils/torrentCache');

async function testStream(videoId) {
  if (!videoId) {
    console.error('❌ Error: Please provide a video ID.');
    process.exit(1);
  }

  console.log(`🚀 Testing stream for ID: ${videoId}...`);

  // 1. Populate cache from scraper
  console.log('🔄 Loading cache...');
  const trending = await getCachedTorrents('trending');
  const popular = await getCachedTorrents('popular');
  const allTorrents = [...trending, ...popular];

  // 2. Find the video by ID
  const video = allTorrents.find(t => t.id === videoId);

  if (!video) {
    console.error(`❌ FAILURE: Video with ID "${videoId}" not found in cache.`);
    return;
  }

  console.log(`✅ Found video: ${video.name}`);

  // 3. Check for the magnet link
  if (video.magnetLink) {
    console.log('🎉 SUCCESS: Magnet link found in cache!\n');
    console.log(video.magnetLink);
  } else {
    console.error('❌ FAILURE: Magnet link is missing from the cached video object.');
  }
}

const videoId = process.argv[2];
testStream(videoId);