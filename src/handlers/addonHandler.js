const { addonBuilder } = require('stremio-addon-sdk');
const catalogHandler = require('./catalogHandler');
const metaHandler = require('./metaHandler');
const streamHandler = require('./streamHandler');
const { getManifest } = require('../config/manifest');
const { getTorrents } = require('../utils/torrentCache');

class AddonHandler {
  constructor(userConfig = {}) {
    this.userConfig = userConfig;
    const allTorrents = getTorrents();
    const idPrefixes = [...new Set(allTorrents.map(t => t.id.substring(0, 3)))];
    idPrefixes.push('js_');
    const dynamicManifest = getManifest(idPrefixes);
    this.builder = new addonBuilder(dynamicManifest);
    this.setupHandlers();
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
