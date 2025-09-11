const { addonBuilder } = require('stremio-addon-sdk');
const catalogHandler = require('./catalogHandler');
const metaHandler = require('./metaHandler');
const streamHandler = require('./streamHandler');
const { manifest } = require('../config/manifest');

class AddonHandler {
  constructor(userConfig = {}) {
    this.userConfig = userConfig;
    this.builder = new addonBuilder(manifest);
    this.setupHandlers();
  }

  setupHandlers() {
    // Setup catalog handler
    this.builder.defineCatalogHandler(async (args) => {
      return await catalogHandler.handle(args, this.userConfig);
    });

    // Setup meta handler
    this.builder.defineMetaHandler(async (args) => {
      return await metaHandler.handle(args, this.userConfig);
    });

    // Setup stream handler
    this.builder.defineStreamHandler(async (args) => {
      return await streamHandler.handle(args, this.userConfig);
    });
  }

  getInterface() {
    return this.builder.getInterface();
  }
}

module.exports = AddonHandler;
