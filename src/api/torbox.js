// src/api/torbox.js
// TorBox API helper: check cache, add magnet, get stream URL
const { request } = require('undici');
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

// Helper: GET JSON with undici
async function getJson(url, headers = {}) {
  try {
    const res = await request(url, { method: 'GET', headers: { accept: 'application/json', ...headers } });
    const status = res.statusCode;
    let json = null;
    try { json = await res.body.json(); } catch { json = null; }
    return { ok: status >= 200 && status < 300, status, json };
  } catch (error) {
    console.error('❌ TorBox GET request failed:', error.message);
    return { ok: false, status: 0, json: null };
  }
}

// Helper: POST with form data (TorBox might expect form data, not JSON)
async function postForm(url, data, headers = {}) {
  try {
    const formData = new URLSearchParams();
    for (const [key, value] of Object.entries(data)) {
      formData.append(key, value);
    }
    
    const res = await request(url, {
      method: 'POST',
      headers: { 
        'content-type': 'application/x-www-form-urlencoded',
        'accept': 'application/json',
        ...headers 
      },
      body: formData.toString(),
    });
    
    const status = res.statusCode;
    let json = null;
    try { json = await res.body.json(); } catch { json = null; }
    return { ok: status >= 200 && status < 300, status, json };
  } catch (error) {
    console.error('❌ TorBox POST form request failed:', error.message);
    return { ok: false, status: 0, json: null };
  }
}

// Check if cached by hash
async function isCached({ magnet, infoHash, token }) {
  const hash = infoHash || extractInfoHash(magnet);
  const headers = authHeaders(token);
  const url = hash
    ? `${TORBOX_BASE}/v1/api/torrents/checkcached?hash=${encodeURIComponent(hash)}`
    : `${TORBOX_BASE}/v1/api/torrents/checkcached?magnet=${encodeURIComponent(magnet || '')}`;
  
  console.log('🔍 Checking TorBox cache...');
  const { ok, status, json } = await getJson(url, headers);
  console.log('🔍 TorBox cache response:', { ok, status, cached: json?.data?.hash ? true : false });
  
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
    `${TORBOX_BASE}/v1/api/torrents/createtorrent`,  // Different endpoint
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

// Get a playable URL for a cached torrent by hash
async function getStreamUrl({ infoHash, token }) {
  if (!infoHash) return { url: null, filename: null };

  const { ok, json } = await postForm(
    `${TORBOX_BASE}/v1/api/torrents/torrentinfo`,
    { hash: infoHash },
    authHeaders(token)
  );

  if (!ok || !json?.data?.files?.length) {
    console.log('❌ Could not get file list from TorBox');
    return { url: null, filename: null };
  }

  const files = json.data.files;
  const videoCandidates = files.filter(f => {
    const n = (f.name || '').toLowerCase();
    return n.endsWith('.mp4') || n.endsWith('.mkv') || n.endsWith('.webm');
  });

  const best = videoCandidates.sort((a, b) => b.size - a.size)[0] || files[0];

  if (!best) {
    console.log('❌ No suitable files found in torrent');
    return { url: null, filename: null };
  }

  // Construct the download URL. This is a common pattern for such APIs.
  const fileUrl = `${TORBOX_BASE}/v1/api/downloads/getfile?hash=${infoHash}&name=${encodeURIComponent(best.name)}&token=${token}`;
  
  console.log(`✅ Constructed stream URL: ${fileUrl}`);
  return { url: fileUrl, filename: best.name };
}

module.exports = { isCached, addMagnet, getStreamUrl, extractInfoHash };
