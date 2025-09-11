const ID_PREFIXES = ['T25','TW9','TWl','UG9','Qnl','TW9t'];

const manifest = {
  id: 'org.stremio.adult.addon',
  version: '1.3.0',
  name: 'Adult Content Addon',
  description: 'Stream adult content from 1337x with TorBox integration. Configure with your TorBox API key for enhanced streaming.',
  resources: [
    'catalog',
    { name: 'meta', types: ['movie'], idPrefixes: ID_PREFIXES },
    { name: 'stream', types: ['movie'], idPrefixes: ID_PREFIXES }
  ],
  types: ['movie'],
  idPrefixes: ID_PREFIXES,
  catalogs: [
    { type: 'movie', id: 'adult-trending', name: '🔥 Trending Adult' },
    { type: 'movie', id: 'adult-popular',  name: '⭐ Popular Adult' }
  ],
  behaviorHints: {
    configurable: true,
    configurationRequired: false
  }
};

module.exports = { manifest, ID_PREFIXES };
