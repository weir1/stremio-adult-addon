const getManifest = (idPrefixes = []) => ({
  id: 'org.stremio.adult.addon',
  version: '1.4.0', // Bump version for this major change
  name: 'Adult Content Addon',
  description: 'Stream adult content from 1337x with TorBox integration. Configure with your TorBox API key for enhanced streaming.',
  resources: [
    'catalog',
    { name: 'meta', types: ['movie'], idPrefixes },
    { name: 'stream', types: ['movie'], idPrefixes }
  ],
  types: ['movie'],
  idPrefixes: idPrefixes,
  catalogs: [
    { type: 'movie', id: 'adult-trending', name: '🔥 Trending Adult' },
    { type: 'movie', id: 'adult-popular',  name: '⭐ Popular Adult' }
  ],
  behaviorHints: {
    configurable: true,
    configurationRequired: false
  }
});

module.exports = { getManifest };
