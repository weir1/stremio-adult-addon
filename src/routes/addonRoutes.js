const express = require('express');
const { getRouter } = require('stremio-addon-sdk');
const AddonHandler = require('../handlers/addonHandler');
const ConfigService = require('../services/configService');

const router = express.Router();

// This middleware initializes a default addon handler for requests without a config
router.use(async (req, res, next) => {
  if (!req.addon) { // Avoid re-initialization
    const handler = new AddonHandler({});
    req.addon = await handler.init();
  }
  next();
});

// Manifest without config
router.get('/manifest.json', (req, res) => {
  const addonInterface = req.addon.getInterface();
  addonInterface.manifest(req, res);
});

// Routes without config
router.get('/catalog/:type/:id.json', (req, res, next) => {
  const addonInterface = req.addon.getInterface();
  addonInterface.catalog(req, res, next);
});
router.get('/meta/:type/:id.json', (req, res, next) => {
  const addonInterface = req.addon.getInterface();
  addonInterface.meta(req, res, next);
});
router.get('/stream/:type/:id.json', (req, res, next) => {
  const addonInterface = req.addon.getInterface();
  addonInterface.stream(req, res, next);
});

// Middleware for routes with config
const configuredRoute = async (req, res, next) => {
  try {
    const configString = req.params.config;
    const userConfig = ConfigService.parseConfigFromUrl(configString);
    const handler = new AddonHandler(userConfig);
    req.addon = await handler.init();
    next();
  } catch (error) {
    console.error('❌ Config parsing error:', error);
    next(error);
  }
};

// Manifest with config
router.get('/:config/manifest.json', configuredRoute, (req, res) => {
  const addonInterface = req.addon.getInterface();
  addonInterface.manifest(req, res);
});

// Routes with config
router.get('/:config/catalog/:type/:id.json', configuredRoute, (req, res, next) => {
  const addonInterface = req.addon.getInterface();
  addonInterface.catalog(req, res, next);
});
router.get('/:config/meta/:type/:id.json', configuredRoute, (req, res, next) => {
  const addonInterface = req.addon.getInterface();
  addonInterface.meta(req, res, next);
});
router.get('/:config/stream/:type/:id.json', configuredRoute, (req, res, next) => {
  const addonInterface = req.addon.getInterface();
  addonInterface.stream(req, res, next);
});

module.exports = router;
