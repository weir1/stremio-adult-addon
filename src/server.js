const { serveHTTP } = require('stremio-addon-sdk');
const express = require('express');

// simple in-memory status map: infoHash -> { state, cachedUrl, progress }
const statusStore = new Map();

function mountServer(addonInterface, { port = 3000, hostname = '0.0.0.0' } = {}) {
  const app = express();

  // Mount the addon interface at root
  serveHTTP(addonInterface, { app });

  // Public status endpoint: /status/:hash.json
  app.get('/status/:hash.json', (req, res) => {
    const hash = (req.params.hash || '').toLowerCase();
    const s = statusStore.get(hash) || { state: 'unknown', cached: false };
    res.type('application/json').send(JSON.stringify({
      ok: true,
      hash,
      state: s.state,
      cached: !!s.cachedUrl,
      progress: s.progress || 0,
      cachedUrl: s.cachedUrl || null,
      updatedAt: s.updatedAt || Date.now()
    }));
  });

  app.listen(port, hostname, () => {
    console.log(`📡 Unified server on http://${hostname}:${port}`);
    console.log(`📡 Status endpoint: GET /status/:hash.json`);
  });

  return {
    // helpers to update status from your stream/TorBox logic
    setStatus(hash, payload) {
      const h = (hash || '').toLowerCase();
      statusStore.set(h, { ...payload, updatedAt: Date.now() });
    }
  };
}

module.exports = { mountServer };
