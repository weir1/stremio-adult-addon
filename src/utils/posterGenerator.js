const posterService = require('../services/posterService');

async function generatePoster(torrentName, torrentInfo, userConfig = {}) {
  try {
    // This now returns an object { poster: url, rating: value }
    return await posterService.getPosterUrl(torrentName, torrentInfo, userConfig);
  } catch (error) {
    console.error('❌ Poster generation error:', error);
    const cleanName = torrentName.replace(/[^\w\s]/g, '').substring(0, 15);
    const fallbackPoster = `https://via.placeholder.com/300x450/FF6B6B/FFFFFF?text=${encodeURIComponent(cleanName)}`;
    return { poster: fallbackPoster, rating: null };
  }
}

module.exports = { generatePoster };