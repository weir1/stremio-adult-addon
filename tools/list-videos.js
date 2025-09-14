const { getCachedTorrents } = require('../src/utils/torrentCache');

async function listAllVideos() {
  console.log('Fetching video lists...\n');

  // Trigger scraping and caching
  const trending = await getCachedTorrents('trending');
  const popular = await getCachedTorrents('popular');

  console.log('--- 🔥 Trending Videos ---');
  if (trending.length > 0) {
    trending.forEach(video => {
      console.log(`ID: ${video.id} | Name: ${video.name}`);
    });
  } else {
    console.log('No trending videos found.');
  }

  console.log('\n--- ⭐ Popular Videos ---');
  if (popular.length > 0) {
    popular.forEach(video => {
      console.log(`ID: ${video.id} | Name: ${video.name}`);
    });
  } else {
    console.log('No popular videos found.');
  }
}

listAllVideos();
