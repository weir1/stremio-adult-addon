const express = require('express');
const TorBoxService = require('../services/torboxService');

const router = express.Router();

router.get('/torbox-status/:hash', async (req, res) => {
  try {
    const hash = (req.params.hash || '').toLowerCase().replace('.json', '');
    const apiKey = req.query.api_key || req.headers['x-torbox-api-key'];
    
    if (!apiKey) {
      return res.status(400).json({
        ok: false,
        error: 'TorBox API key required',
        hash: hash
      });
    }
    
    const torboxService = new TorBoxService(apiKey);
    const status = await torboxService.checkTorrentStatus(hash);
    
    res.type('application/json').send(JSON.stringify(status));
  } catch (error) {
    console.error('❌ TorBox status error:', error);
    res.status(500).json({
      ok: false,
      error: 'Internal server error',
      hash: req.params.hash || 'unknown'
    });
  }
});

router.get('/status/:hash.json', (req, res) => {
  const hash = (req.params.hash || '').toLowerCase();
  
  res.type('application/json').send(JSON.stringify({
    ok: true,
    hash,
    state: 'queued',
    cached: false,
    progress: 0,
    cachedUrl: null,
    updatedAt: Date.now(),
    message: 'Configure TorBox API key for real status updates'
  }));
});

module.exports = router;
