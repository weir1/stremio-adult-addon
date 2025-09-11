const express = require('express');
const addonRoutes = require('./addonRoutes');
const ConfigService = require('../services/configService');
const { manifest } = require('../config/manifest');

const router = express.Router();

// Health check
router.get('/', (req, res) => {
  res.json({
    ok: true,
    msg: 'Adult Content Addon',
    manifest: '/manifest.json',
    configure: '/configure',
    version: manifest.version,
    name: manifest.name,
    description: manifest.description
  });
});

// Configuration page
router.get('/configure', (req, res) => {
  const configHtml = ConfigService.generateConfigPage();
  res.type('text/html').send(configHtml);
});

// Mount addon routes
router.use('/', addonRoutes);

module.exports = router;
