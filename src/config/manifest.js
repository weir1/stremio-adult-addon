const getManifest = (idPrefixes = []) => ({
  id: 'org.stremio.adult.addon',
  version: '1.5.3', // Bump version to force manifest refresh
  name: 'Adult Content Addon',
  description: 'Stream adult content from 1337x and FansDB. Configure with your API keys for enhanced streaming.',
  resources: [
    'catalog',
    { name: 'meta', types: ['movie', 'channel'], idPrefixes },
    { name: 'stream', types: ['movie'], idPrefixes }
  ],
  types: ['movie', 'channel'],
  idPrefixes: idPrefixes,
  catalogs: [
    { type: 'movie', id: 'adult-search', name: '🔍 Search Results', extra: [{ name: 'search', isRequired: true }] },
    { type: 'movie', id: 'adult-trending', name: '🔥 Trending Torrents' },
    { type: 'movie', id: 'adult-popular',  name: '⭐ Popular Torrents' },
    { type: 'channel', id: 'fansdb-top', name: '💃 Top FansDB Performers' }
  ],
  behaviorHints: {
    configurable: true,
    configurationRequired: false
  }
});

module.exports = { getManifest };
