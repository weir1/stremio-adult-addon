const { isCached, addMagnet } = require('../api/torbox');

async function processStream(magnet) {
  try {
    // Step 1: Check if cached
    const cached = await isCached(magnet);
    if (cached && cached.success && cached.data && Object.keys(cached.data).length > 0) {
      return { status: 'cached', data: cached.data };
    }

    // Step 2: Try adding if not cached
    const added = await addMagnet(magnet);
    if (added && added.success) {
      return { status: 'added', data: added.data };
    }

    return { status: 'error', error: cached?.error || added?.error || 'Unknown error' };
  } catch (err) {
    return { status: 'error', error: err.message };
  }
}

module.exports = { processStream };