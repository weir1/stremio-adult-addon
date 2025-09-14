// src/services/fansdbService.js
const { graphQlQuery } = require('../api/fansdb');

class FansDBService {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  async getTopPerformers(page = 1, limit = 20) {
    const query = `
      query GetPerformers($input: PerformerQueryInput!) {
        queryPerformers(input: $input) {
          count
          performers {
            id
            name
            images
          }
        }
      }
    `;
    const variables = { input: { page, limit, sort: 'TRENDING' } };
    const { ok, data, error } = await graphQlQuery(query, variables, this.apiKey);

    if (ok && data?.queryPerformers?.performers) {
      return data.queryPerformers.performers.map(p => ({
        id: `fansdb:${p.id}`,
        type: 'channel',
        name: p.name,
        poster: p.images[0],
        posterShape: 'square',
      }));
    } else {
      console.error('❌ Could not fetch top performers from FansDB:', error);
      return [];
    }
  }

  async getPerformerMeta(performerId) {
    const query = `
      query GetPerformerMeta($id: ID!) {
        findPerformer(id: $id) {
          id
          name
          images
          scenes {
            id
            title
            release_date
            images
          }
        }
      }
    `;
    const variables = { id: performerId };
    const { ok, data, error } = await graphQlQuery(query, variables, this.apiKey);

    if (ok && data?.findPerformer) {
      const p = data.findPerformer;
      return {
        id: `fansdb:${p.id}`,
        type: 'channel',
        name: p.name,
        poster: p.images[0],
        posterShape: 'square',
        videos: p.scenes.map(s => ({
          id: `fansdb-scene:${p.id}:${s.id}`,
          title: s.title,
          released: s.release_date,
          thumbnail: s.images[0],
        }))
      };
    } else {
      console.error(`❌ Could not fetch metadata for performer ${performerId}:`, error);
      return null;
    }
  }
}

module.exports = FansDBService;