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

module.exports = { extractInfoHash };