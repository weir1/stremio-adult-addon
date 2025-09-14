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
  
  const addon = new AddonHandler(userConfig);
  const sdkRouter = getRouter(addon.getInterface());

  // The SDK router needs a clean URL. We rewrite it here.
  // e.g., /<config>/manifest.json -> /manifest.json
  const pathParts = req.path.split('/');
  const manifestIndex = pathParts.indexOf('manifest.json');
  const catalogIndex = pathParts.indexOf('catalog');
  const metaIndex = pathParts.indexOf('meta');
  const streamIndex = pathParts.indexOf('stream');

  if (manifestIndex > -1) {
    req.url = '/' + pathParts.slice(manifestIndex).join('/');
  } else if (catalogIndex > -1) {
    req.url = '/' + pathParts.slice(catalogIndex).join('/');
  } else if (metaIndex > -1) {
    req.url = '/' + pathParts.slice(metaIndex).join('/');
  } else if (streamIndex > -1) {
    req.url = '/' + pathParts.slice(streamIndex).join('/');
  }
  
  sdkRouter(req, res, next);
};

// Route for addon requests with optional configuration
router.get('/:config?/manifest.json', addonMiddleware);
router.get('/:config?/catalog/:type/:id.json', addonMiddleware);
router.get('/:config?/meta/:type/:id.json', addonMiddleware);
router.get('/:config?/stream/:type/:id.json', addonMiddleware);

module.exports = router;
