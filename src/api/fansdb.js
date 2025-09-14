// src/api/fansdb.js
// FansDB API helper: send GraphQL queries
const { request } = require('undici');

const FANSDB_ENDPOINT = 'https://fansdb.cc/graphql';

async function graphQlQuery(query, variables, token) {
  if (!token) {
    console.error('❌ FansDB API key is required.');
    return { ok: false, data: null, error: 'API key is missing' };
  }

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  try {
    const res = await request(FANSDB_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, variables })
    });

    const status = res.statusCode;
    const json = await res.body.json();

    if (status >= 200 && status < 300) {
      return { ok: true, data: json.data, error: json.errors };
    } else {
      console.error('❌ FansDB API request failed:', { status, body: json });
      return { ok: false, data: null, error: json };
    }
  } catch (error) {
    console.error('❌ FansDB API request error:', error);
    return { ok: false, data: null, error: error.message };
  }
}

module.exports = { graphQlQuery };
