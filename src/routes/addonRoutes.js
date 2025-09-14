const express = require('express');
const { getRouter } = require('stremio-addon-sdk');
const AddonHandler = require('../handlers/addonHandler');
const ConfigService = require('../services/configService');

const router = express.Router();

// This single middleware handles all requests.
// It determines the configuration, creates an addon instance with a dynamic manifest,
// and then uses the official SDK router to handle the request.
const addonMiddleware = (req, res, next) => {
  const configString = req.params.config;
  const userConfig = configString ? ConfigService.parseConfigFromUrl(configString) : {};
  
  // Create a new handler for each request to get the latest dynamic manifest
  const addon = new AddonHandler(userConfig);
  const sdkRouter = getRouter(addon.getInterface());
  
  sdkRouter(req, res, next);
};

// Route for addon requests with optional configuration
router.get('/:config?/manifest.json', addonMiddleware);
router.get('/:config?/catalog/:type/:id.json', addonMiddleware);
router.get('/:config?/meta/:type/:id.json', addonMiddleware);
router.get('/:config?/stream/:type/:id.json', addonMiddleware);

module.exports = router;
