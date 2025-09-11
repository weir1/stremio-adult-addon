const { request } = require('undici');

class PosterService {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
  }

  // Extract useful search terms from torrent names
  extractSearchTerms(torrentName) {
    let cleaned = torrentName
      .replace(/\.(mp4|mkv|avi|wmv|mov)$/i, '')
      .replace(/\b(XXX|PORN|ADULT|HD|720p|1080p|4K|WEB-DL|BluRay|DVDRip|XviD|x264|x265)\b/gi, '')
      .replace(/\b(2160p|1440p|480p)\b/gi, '')
      .replace(/[\[\]()]/g, ' ')
      .replace(/[-_.]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const studioPatterns = [
      /^(Brazzers|BangBros|RealityKings|TeamSkeet|Naughty\s?America|Digital\s?Playground)/i,
      /^(MyPervyFamily|OnlyFans|MomSwap|FamilyStrokes|SisLovesMe)/i,
      /^(Tushy|Vixen|Blacked|BlackedRaw|Deeper|Milfy)/i
    ];

    let studio = null;
    let title = cleaned;

    for (const pattern of studioPatterns) {
      const match = cleaned.match(pattern);
      if (match) {
        studio = match[0];
        title = cleaned.replace(pattern, '').trim();
        break;
      }
    }

    return {
      original: torrentName,
      cleaned: title,
      studio: studio,
      searchTerms: [title, studio].filter(Boolean)
    };
  }

  // Search ThePornDB with minimal query to avoid schema issues
  async searchThePornDB(searchTerms, apiKey) {
    if (!apiKey) {
      console.log('🔍 No ThePornDB API key provided');
      return null;
    }

    try {
      const searchTerm = searchTerms.join(' ').substring(0, 30); // Shorter search term
      console.log('🔍 Searching ThePornDB for:', searchTerm);
      
      // Minimal query to avoid schema issues
      const response = await request('https://theporndb.net/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'User-Agent': 'Stremio-Adult-Addon/1.3.0'
        },
        body: JSON.stringify({
          query: `
            query SearchScenes($term: String!) {
              searchScene(term: $term) {
                id
                title
                date
                images {
                  url
                }
                studio {
                  name
                }
              }
            }
          `,
          variables: { 
            term: searchTerm
          }
        })
      });

      const result = await response.body.json();
      
      if (result.errors) {
        console.error('❌ ThePornDB API errors:', result.errors);
        console.log('🔧 Falling back to enhanced placeholders...');
        return null;
      }

      if (result.data?.searchScene && Array.isArray(result.data.searchScene) && result.data.searchScene.length > 0) {
        const scene = result.data.searchScene[0];
        console.log('✅ Found ThePornDB scene:', scene.title);
        
        // Get the first available image
        const images = scene.images || [];
        const poster = images[0];

        return {
          title: scene.title,
          posterUrl: poster?.url || null,
          studio: scene.studio?.name || null,
          date: scene.date
        };
      }

      console.log('🔍 No results found in ThePornDB for:', searchTerm);
      return null;
    } catch (error) {
      console.error('❌ ThePornDB search error:', error.message);
      return null;
    }
  }

  // Generate enhanced poster with better styling
  generateEnhancedPoster(torrentName, torrentInfo, searchData = null) {
    const { studio, cleaned } = this.extractSearchTerms(torrentName);
    
    // Use actual poster if found from database
    if (searchData?.posterUrl) {
      console.log('✅ Using ThePornDB poster for:', cleaned);
      return searchData.posterUrl;
    }

    // Create better placeholder posters
    const colors = [
      'FF6B6B/FFFFFF', // Red
      '8A2BE2/FFFFFF', // Purple  
      'FF1493/FFFFFF', // Deep Pink
      'DC143C/FFFFFF', // Crimson
      '4B0082/FFFFFF', // Indigo
      'B22222/FFFFFF'  // Fire Brick
    ];

    const hash = torrentName.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    const colorIndex = Math.abs(hash) % colors.length;
    const color = colors[colorIndex];

    let posterText = studio || cleaned.substring(0, 20);
    
    if (torrentInfo.size) {
      const sizeMatch = torrentInfo.size.match(/(\d+\.?\d*\s*(GB|MB))/i);
      if (sizeMatch) {
        posterText += ` (${sizeMatch[1]})`;
      }
    }

    if (torrentInfo.seeders && parseInt(torrentInfo.seeders) > 10) {
      posterText += ` 🌱${torrentInfo.seeders}`;
    }

    return `https://via.placeholder.com/300x450/${color}?text=${encodeURIComponent(posterText)}`;
  }

  // Main method to get poster
  async getPosterUrl(torrentName, torrentInfo, userConfig = {}) {
    const cacheKey = `poster_${torrentName}`;
    
    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < this.cacheExpiry) {
      return cached.url;
    }

    try {
      const { searchTerms } = this.extractSearchTerms(torrentName);
      let posterData = null;
      
      // Try ThePornDB if enabled and API key provided
      if (userConfig.enableThePornDB && userConfig.theporndbApiKey) {
        posterData = await this.searchThePornDB(searchTerms, userConfig.theporndbApiKey);
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // Generate poster (either real or enhanced placeholder)
      const posterUrl = this.generateEnhancedPoster(torrentName, torrentInfo, posterData);
      
      // Cache the result
      this.cache.set(cacheKey, {
        url: posterUrl,
        timestamp: Date.now()
      });

      return posterUrl;
    } catch (error) {
      console.error('❌ Poster service error:', error);
      return this.generateEnhancedPoster(torrentName, torrentInfo);
    }
  }
}

module.exports = new PosterService();
