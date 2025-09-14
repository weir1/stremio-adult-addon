const axios = require('axios');
const FormData = require('form-data');
const { extractInfoHash } = require('../utils/helpers');

const BASE_URL = 'https://api.torbox.app/v1/api'; // <- verified from docs

function getHeaders() {
  const apiKey = process.env.TORBOX_API_KEY;
  if (!apiKey) {
    throw new Error('TorBox API key is missing. Set TORBOX_API_KEY env var.');
  }
  return {
    Authorization: `Bearer ${apiKey}`,
  };
}

async function isCached(magnet) {
  try {
    const infoHash = extractInfoHash(magnet);
    const res = await axios.post(
      `${BASE_URL}/torrents/checkcached`,
      { hashes: [infoHash] },
      { headers: {...getHeaders(), 'Content-Type': 'application/json'} }
    );
    return res.data;
  } catch (err) {
    if (err.response) return { error: err.response.data };
    throw err;
  }
}

async function addMagnet(magnet) {
  try {
    const form = new FormData();
    form.append('magnet', magnet);

    const headers = {
      ...getHeaders(),
      ...form.getHeaders(),
    };

    const res = await axios.post(
      `${BASE_URL}/torrents/createtorrent`,
      form,
      { headers }
    );
    return res.data;
  } catch (err) {
    if (err.response) return { error: err.response.data };
    throw err;
  }
}

module.exports = { isCached, addMagnet };