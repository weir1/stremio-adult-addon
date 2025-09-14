const { request } = require('undici');

class PosterService {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
  }

  // Enhanced search term extraction
  extractSearchTerms(torrentName) {
    let cleaned = torrentName
      .replace(/\.(mp4|mkv|avi|wmv|mov)$/i, '')
      .replace(/\b(XXX|PORN|ADULT|HD|720p|1080p|4K|WEB-DL|BluRay|DVDRip|XviD|x264|x265|REMASTERED)\b/gi, '')
      .replace(/\b(2160p|1440p|480p)\b/gi, '')
      .replace(/[\{\[\(].*?[\)\]\}]/g, '') // Remove content in brackets
      .replace(/\d{2,4}[-._]\d{2,4}[-._]\d{2,4}/, '') // Remove dates like 25-09-14
      .replace(/[-_.]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const studioPatterns = [
      /^(Brazzers|BangBros|RealityKings|TeamSkeet|Naughty\s?America|Digital\s?Playground)/i,
      /^(MyPervyFamily|OnlyFans|MomSwap|FamilyStrokes|SisLovesMe|AnalMom|MomXXX)/i,
      /^(Tushy|Vixen|Blacked|BlackedRaw|Deeper|Milfy|FamilyTherapyXXX|AskYourMother)/i,
      /^(MyFriendsHotMom|FreeUseFantasy|AssMasterpiece|OopsFamily|CheatingMommy|PrincessCum|Shoplyfter)/i
    ];

    let studio = null;
    let title = cleaned;

    for (const pattern of studioPatterns) {
      const match = cleaned.match(pattern);
      if (match) {
        studio = match[0].replace(/\s/g, ''); // Use consistent studio name
        title = cleaned.replace(pattern, '').trim();
        break;
      }
    }
    
    // Further clean the title if a studio was found
    if (studio) {
      title = title.split(' ').filter(word => isNaN(word)).join(' ');
    }

    return {
      original: torrentName,
      cleaned: title,
      studio: studio,
      searchQuery: studio ? `${studio} ${title}` : title
    };
  }

  // Search ThePornDB with a more focused query
  async searchThePornDB(searchQuery, apiKey) {
    if (!apiKey) {
      return null;
    }

    try {
      const term = searchQuery.substring(0, 50);
      console.log(`🔍 Searching ThePornDB for: "${term}"`);
      
      const response = await request('https://theporndb.net/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'User-Agent': 'Stremio-Adult-Addon/1.3.1'
        },
        body: JSON.stringify({
          query: `
            query SearchScenes($term: String!) {
              searchScene(term: $term, limit: 1) {
                id
                title
                images {
                  url
                }
                studio {
                  name
                }
              }
            }
          `,
          variables: { term }
        })
      });

      const result = await response.body.json();
      
      if (result.errors) {
        console.error('❌ ThePornDB API errors:', result.errors.map(e => e.message).join(', '));
        return null;
      }

      const scene = result.data?.searchScene?.[0];
      if (scene && scene.images && scene.images.length > 0 && scene.images[0].url) {
        console.log(`✅ Found ThePornDB poster for "${scene.title}"`);
        return scene.images[0].url;
      }

      console.log(`  - No results from ThePornDB for "${term}"`);
      return null;
    } catch (error) {
      console.error('❌ ThePornDB search error:', error.message);
      return null;
    }
  }

  // Generate enhanced poster with better styling and information
  generateEnhancedPoster(torrentName, torrentInfo) {
    const { studio, cleaned } = this.extractSearchTerms(torrentName);
    
    const colors = [
      'FF6B6B/FFFFFF', '4ECDC4/FFFFFF', '45B7D1/FFFFFF', 'F9A825/000000', 
      '8E44AD/FFFFFF', '2C3E50/FFFFFF', 'E74C3C/FFFFFF', '3498DB/FFFFFF'
    ];
    const hash = torrentName.split('').reduce((a, b) => (((a << 5) - a) + b.charCodeAt(0)) | 0, 0);
    const color = colors[Math.abs(hash) % colors.length];

    let mainText = studio || cleaned.split(' ').slice(0, 3).join(' ');
    mainText = mainText.substring(0, 25);

    let subText = '';
    const sizeMatch = torrentInfo.size.match(/(\d+\.?\d*\s*(GB|MB))/i);
    if (sizeMatch) subText += `${sizeMatch[1]}`;
    if (torrentInfo.seeders > 0) subText += ` | 🌱${torrentInfo.seeders}`;

    // Using a different placeholder service that allows more customization
    return `https://fakeimg.pl/300x450/${color}/?text=${encodeURIComponent(mainText)}&font_size=40&font=bebas&data=${encodeURIComponent(subText)}`;
  }

  // Main method to get poster
  async getPosterUrl(torrentName, torrentInfo, userConfig = {}) {
    const cacheKey = `poster_${torrentName}`;
    const cached = this.cache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < this.cacheExpiry) {
      return cached.url;
    }

    let posterUrl = null;
    try {
      if (userConfig.enableThePornDB && userConfig.theporndbApiKey) {
        const { searchQuery } = this.extractSearchTerms(torrentName);
        posterUrl = await this.searchThePornDB(searchQuery, userConfig.theporndbApiKey);
        await new Promise(resolve => setTimeout(resolve, 250)); // Rate limit
      }

      // 2nd fallback: Use poster scraped from 1337x
      if (!posterUrl && torrentInfo.poster) {
        console.log(`✅ Using 1337x poster for "${torrentName.substring(0, 30)}"`);
        posterUrl = torrentInfo.poster;
      }

      // 3rd fallback: Generate a placeholder
      if (!posterUrl) {
        posterUrl = this.generateEnhancedPoster(torrentName, torrentInfo);
      }
      
      this.cache.set(cacheKey, { url: posterUrl, timestamp: Date.now() });
      return posterUrl;
    } catch (error) {
      console.error('❌ Poster service error:', error);
      return this.generateEnhancedPoster(torrentName, torrentInfo); // Fallback on error
    }
  }
}

module.exports = new PosterService();