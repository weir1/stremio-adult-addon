const posterService = require('../services/posterService');

async function generatePoster(torrentName, torrentInfo, userConfig = {}) {
  try {
    return await posterService.getPosterUrl(torrentName, torrentInfo, userConfig);
  } catch (error) {
    console.error('❌ Poster generation error:', error);
    // Fallback to simple placeholder
    const cleanName = torrentName.replace(/[^\w\s]/g, '').substring(0, 15);
    return `https://via.placeholder.com/300x450/FF6B6B/FFFFFF?text=${encodeURIComponent(cleanName)}`;
  }
}

module.exports = { generatePoster };
