const { addonBuilder } = require('stremio-addon-sdk');
const catalogHandler = require('./catalogHandler');
const metaHandler = require('./metaHandler');
const streamHandler = require('./streamHandler');
const { getManifest } = require('../config/manifest');
const { getCachedTorrents } = require('../utils/torrentCache');

class AddonHandler {
  constructor(userConfig = {}) {
    this.userConfig = userConfig;
    // This is now an async operation, so we need a way to initialize it.
    // We will use a static `init` method to create and initialize an instance.
  }

  async init() {
    console.log('Initializing addon with dynamic prefixes...');
    const trending = await getCachedTorrents('trending');
    const popular = await getCachedTorrents('popular');
    const allTorrents = [...trending, ...popular];

    // Dynamically generate prefixes from all available torrent IDs
    const idPrefixes = [...new Set(allTorrents.map(t => t.id.substring(0, 3)))];
    console.log(`Generated ${idPrefixes.length} dynamic ID prefixes.`);

    const dynamicManifest = getManifest(idPrefixes);
    this.builder = new addonBuilder(dynamicManifest);
    this.setupHandlers();
    return this;
  }

  setupHandlers() {
    this.builder.defineCatalogHandler(async (args) => {
      return await catalogHandler.handle(args, this.userConfig);
    });

    this.builder.defineMetaHandler(async (args) => {
      return await metaHandler.handle(args, this.userConfig);
    });

    this.builder.defineStreamHandler(async (args) => {
      return await streamHandler.handle(args, this.userConfig);
    });
  }

  getInterface() {
    return this.builder.getInterface();
  }
}

module.exports = AddonHandler;
