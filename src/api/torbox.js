// src/api/torbox.js
// TorBox API helper: check cache, add magnet, get stream URL
const axios = require('axios');
const FormData = require('form-data');
const TORBOX_BASE = process.env.TORBOX_BASE || 'https://api.torbox.app';

function authHeaders(token) {
  return token ? { authorization: `Bearer ${token}` } : {};
}

// Extract infoHash from magnet with better regex
function extractInfoHash(magnet) {
  try {
    if (!magnet || typeof magnet !== 'string') return null;
    
    const patterns = [
      /xt=urn:btih:([a-fA-F0-9]{40})/i,    // 40 char hex
      /xt=urn:btih:([a-zA-Z0-9]{32})/i,    // 32 char base32
      /btih:([a-fA-F0-9]{40})/i,           // Alternative format
      /hash=([a-fA-F0-9]{40})/i            // Hash parameter
    ];
    
    for (const pattern of patterns) {
      const match = magnet.match(pattern);
      if (match && match[1]) {
        const hash = match[1].toLowerCase();
        console.log('✅ Extracted info hash:', hash);
        return hash;
      }
    }
    
    console.log('❌ No info hash found in magnet');
    return null;
  } catch (error) {
    console.error('❌ Hash extraction error:', error);
    return null;
  }
}

// Helper: GET JSON with axios
async function getJson(url, headers = {}) {
  try {
    const res = await axios.get(url, { headers: { accept: 'application/json', ...headers } });
    return { ok: true, status: res.status, headers: res.headers, json: res.data };
  } catch (error) {
    console.error('❌ TorBox GET request failed:', error.message);
    if (error.response) {
      return { ok: false, status: error.response.status, headers: error.response.headers, json: error.response.data };
    }
    return { ok: false, status: 0, headers: null, json: null };
  }
}

// Helper: POST with form data
async function postForm(url, data, headers = {}) {
  try {
    const form = new FormData();
    for (const [key, value] of Object.entries(data)) {
      form.append(key, value);
    }

    const res = await axios.post(url, form, {
      headers: {
        ...headers,
        ...form.getHeaders(),
      },
    });
    return { ok: true, status: res.status, json: res.data };
  } catch (error) {
    console.error('❌ TorBox POST form request failed:', error.message);
    if (error.response) {
      return { ok: false, status: error.response.status, json: error.response.data };
    }
    return { ok: false, status: 0, json: null };
  }
}

// Check if cached by hash
async function isCached({ magnet, infoHash, token }) {
  const hash = infoHash || extractInfoHash(magnet);
  const url = hash
    ? `${TORBOX_BASE}/v1/api/torrents/checkcached?hash=${encodeURIComponent(hash)}`
    : `${TORBOX_BASE}/v1/api/torrents/checkcached?magnet=${encodeURIComponent(magnet || '')}`;
  
  console.log('🔍 Checking TorBox cache...');
  const { ok, status, json } = await getJson(url, authHeaders(token));
  console.log('🔍 TorBox cache response:', { ok, status, cached: !!(ok && json?.data && Object.keys(json.data).length > 0) });
  
  // TorBox returns success:true with empty data{} when not cached
  const cached = !!(ok && json?.data && Object.keys(json.data).length > 0);
  return { cached, data: ok ? json : null, hash: hash || null };
}

// FIXED: Enqueue magnet on TorBox using form data
async function addMagnet({ magnet, token }) {
  if (!magnet) return { ok: false, data: null };
  
  console.log('🟡 Adding magnet to TorBox with form data...');
  
  // Try form data format first
  const { ok, status, json } = await postForm(
    `${TORBOX_BASE}/v1/api/torrents/createtorrent`,
    { magnet }, 
    authHeaders(token)
  );
  
  console.log('🟡 TorBox add response:', { ok, status, json });
  
  if (!ok && status === 405) {
    // Try alternative endpoint if method not allowed
    console.log('🟡 Trying alternative TorBox endpoint...');
    const altResponse = await postForm(
      `${TORBOX_BASE}/v1/api/torrents/requestdl`,
      { magnet },
      authHeaders(token)
    );
    console.log('🟡 Alternative TorBox response:', altResponse);
    return { ok: altResponse.ok, data: altResponse.ok ? altResponse.json : null };
  }
  
  return { ok, data: ok ? json : null };
}

async function getTorrentInfo({ infoHash, token }) {
    if (!infoHash) return null;

    const { ok, json } = await getJson(`${TORBOX_BASE}/v1/api/torrents/mylist`, authHeaders(token));

    if (!ok || !json?.data) {
        console.log('❌ Could not get torrent list from TorBox');
        return null;
    }

    const torrents = json.data;
    const matchingTorrent = torrents.find(t => t.hash.toLowerCase() === infoHash.toLowerCase());

    if (matchingTorrent) {
        console.log(`✅ Found torrent id: ${matchingTorrent.id}`);
        return matchingTorrent;
    }

    console.log(`❌ Could not find torrent with hash ${infoHash} in mylist`);
    return null;
}

// Get a playable URL for a cached torrent by hash
async function getStreamUrl({ torrent, token }) {
  if (!torrent || !torrent.id || !torrent.hash) return { url: null, filename: null };

  let files = torrent.files;
  if (!files || !files.length) {
      // if files are not in the mylist response, get them from torrentinfo
      const { ok: torrentInfoOk, json: torrentInfoJson } = await postForm(
        `${TORBOX_BASE}/v1/api/torrents/torrentinfo`,
        { hash: torrent.hash },
        authHeaders(token)
      );
      if (torrentInfoOk && torrentInfoJson?.data?.files?.length) {
          files = torrentInfoJson.data.files;
      } else {
          console.log('❌ Could not get file list from TorBox');
          return { url: null, filename: null };
      }
  }

  const videoCandidates = files.filter(f => {
    const n = (f.name || '').toLowerCase();
    return n.endsWith('.mp4') || n.endsWith('.mkv') || n.endsWith('.webm');
  });

  console.log(' Torrent object:', torrent);
  const best = videoCandidates.sort((a, b) => b.size - a.size)[0] || files[0];
  console.log('Best video file:', best);

  if (!best) {
    console.log('❌ No suitable files found in torrent');
    return { url: null, filename: null };
  }

  const torrentId = torrent.id;
  const fileId = best.id;

  if (fileId === undefined) {
    console.log('❌ No file ID found for the best video file');
    return { url: null, filename: null };
  }

  // Now, create the stream using the correct endpoint
  const requestDlUrl = `${TORBOX_BASE}/v1/api/torrents/requestdl`;
  const requestDlBody = { torrent_id: torrentId, file_id: fileId };
  
  console.log(`⚡️ Requesting download link from TorBox: ${requestDlUrl}`);

  try {
    const res = await axios.post(requestDlUrl, requestDlBody, {
      headers: {
        ...authHeaders(token),
        'Content-Type': 'application/json',
      },
    });

    const streamUrl = res.data;
    
    if (streamUrl && typeof streamUrl === 'string') {
      console.log(`✅ Got stream URL from requestdl: ${streamUrl}`);
      return { url: streamUrl, filename: best.name };
    }
  } catch (error) {
    console.error('❌ TorBox requestdl failed:', error.message);
    if (error.response) {
      console.error('❌ TorBox requestdl response:', error.response.data);
    }
  }

  console.log('❌ Failed to get a valid stream URL from TorBox');
  return { url: null, filename: null };
}

module.exports = { isCached, addMagnet, getStreamUrl, extractInfoHash, getTorrentInfo };