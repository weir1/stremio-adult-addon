const { getCachedTorrents } = require('../src/utils/torrentCache');
const posterService = require('../src/services/posterService');

async function testPosters(apiKey) {
  if (!apiKey) {
    console.warn('⚠️ Warning: No ThePornDB API key provided. Testing fallback poster generation only.\n');
  }

  const userConfig = {
    enableThePornDB: !!apiKey,
    theporndbApiKey: apiKey
  };

  console.log('🚀 Starting Poster Test...');
  console.log(`ThePornDB Integration: ${userConfig.enableThePornDB ? 'ENABLED' : 'DISABLED'}\n`);

  // Fetch a real list of torrents to test against
  const trending = await getCachedTorrents('trending');
  const popular = await getCachedTorrents('popular');
  const allVideos = [...trending, ...popular];
  if (allVideos.length === 0) {
    console.error('❌ Could not fetch any torrents to test. Please check connectivity.');
    return;
  }

  // Select a few random samples from the available videos
  const samples = allVideos.sort(() => 0.5 - Math.random()).slice(0, 4);

  if (samples.length === 0) {
    console.error('❌ Could not find sample torrents to test.');
    return;
  }

  console.log(`Testing ${samples.length} video posters...\n`);

  for (const video of samples) {
    console.log(`🎬 Testing: ${video.name}`);
    const posterUrl = await posterService.getPosterUrl(video.name, video, userConfig);
    console.log(`   => URL: ${posterUrl}\n`);
  }

  console.log('🏁 Test Complete.');
}

// Get API key from command line arguments
const apiKey = process.argv[2];
testPosters(apiKey);
