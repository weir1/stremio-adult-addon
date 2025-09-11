const express = require('express');
const { getRouter } = require('stremio-addon-sdk');
const AddonHandler = require('../handlers/addonHandler');
const ConfigService = require('../services/configService');

const router = express.Router();

// Default addon routes (no config)
const defaultAddon = new AddonHandler({});
const defaultRouter = getRouter(defaultAddon.getInterface());

router.use('/manifest.json', defaultRouter);
router.use('/catalog', defaultRouter);
router.use('/meta', defaultRouter);
router.use('/stream', defaultRouter);

// FIXED: Handle encoded config URLs - match everything before /manifest.json
router.get(/^\/([^\/]+)\/manifest\.json$/, (req, res, next) => {
  try {
    const configString = req.params[0];
    console.log('🔧 Parsing config string:', configString);
    const userConfig = ConfigService.parseConfigFromUrl(configString);
    console.log('🔧 Parsed config:', userConfig);
    
    const configuredAddon = new AddonHandler(userConfig);
    const configuredRouter = getRouter(configuredAddon.getInterface());
    
    // Modify the request path for the addon router
    req.url = '/manifest.json';
    req.path = '/manifest.json';
    
    configuredRouter(req, res, next);
  } catch (error) {
    console.error('❌ Config parsing error:', error);
    next(error);
  }
});

router.get(/^\/([^\/]+)\/catalog\/(.+)$/, (req, res, next) => {
  try {
    const configString = req.params[0];
    const catalogPath = req.params[1];
    console.log('🔧 Catalog config string:', configString);
    const userConfig = ConfigService.parseConfigFromUrl(configString);
    
    const configuredAddon = new AddonHandler(userConfig);
    const configuredRouter = getRouter(configuredAddon.getInterface());
    
    // Modify the request path for the addon router
    req.url = `/catalog/${catalogPath}`;
    req.path = `/catalog/${catalogPath}`;
    
    configuredRouter(req, res, next);
  } catch (error) {
    console.error('❌ Config parsing error:', error);
    next(error);
  }
});

router.get(/^\/([^\/]+)\/meta\/(.+)$/, (req, res, next) => {
  try {
    const configString = req.params[0];
    const metaPath = req.params[1];
    console.log('🔧 Meta config string:', configString);
    const userConfig = ConfigService.parseConfigFromUrl(configString);
    
    const configuredAddon = new AddonHandler(userConfig);
    const configuredRouter = getRouter(configuredAddon.getInterface());
    
    // Modify the request path for the addon router
    req.url = `/meta/${metaPath}`;
    req.path = `/meta/${metaPath}`;
    
    configuredRouter(req, res, next);
  } catch (error) {
    console.error('❌ Config parsing error:', error);
    next(error);
  }
});

router.get(/^\/([^\/]+)\/stream\/(.+)$/, (req, res, next) => {
  try {
    const configString = req.params[0];
    const streamPath = req.params[1];
    console.log('🔧 Stream config string:', configString);
    const userConfig = ConfigService.parseConfigFromUrl(configString);
    
    const configuredAddon = new AddonHandler(userConfig);
    const configuredRouter = getRouter(configuredAddon.getInterface());
    
    // Modify the request path for the addon router
    req.url = `/stream/${streamPath}`;
    req.path = `/stream/${streamPath}`;
    
    configuredRouter(req, res, next);
  } catch (error) {
    console.error('❌ Config parsing error:', error);
    next(error);
  }
});

module.exports = router;
