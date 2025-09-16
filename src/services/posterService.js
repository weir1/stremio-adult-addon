const { request } = require('undici');
const cheerio = require('cheerio');

class PosterService {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
  }

  extractSearchTerms(torrentName) {
    let cleaned = torrentName
      .replace(/\.(mp4|mkv|avi|wmv|mov)$/i, '')
      .replace(/\b(HD|720p|1080p|4K|WEB-DL|BluRay|DVDRip|XviD|x264|x265|REMASTERED)\b/gi, '')
      .replace(/\b(2160p|1440p|480p)\b/gi, '')
      .replace(/[-_.]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return {
      original: torrentName,
      cleaned: cleaned,
      studio: null,
      searchQuery: cleaned
    };
  }

  async searchThePornDB(searchQuery, apiKey) {
    if (!apiKey) return null;
    try {
      const term = searchQuery.substring(0, 50);
      console.log(`🔍 Searching ThePornDB for: "${term}"`);
      
      const response = await request('https://theporndb.net/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'User-Agent': 'Stremio-Adult-Addon/1.4.0'
        },
        body: JSON.stringify({
          query: `
            query SearchScenes($term: String!) {
              searchScene(term: $term, limit: 1) {
                id
                title
                score
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
        const rating = scene.score ? parseFloat(scene.score) : null;
        if (rating) console.log(`  • Rating: ${rating}/10`);
        return { poster: scene.images[0].url, rating: rating };
      }

      console.log(`  - No results from ThePornDB for "${term}"`);
      return null;
    } catch (error) {
      console.error('❌ ThePornDB search error:', error.message);
      return null;
    }
  }

  async scrapePosterFromUrl(url) {
    if (!url) return null;
    try {
      console.log(`🖼️ Scraping for poster on page: ${url}`);
      const response = await request(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      const html = await response.body.text();
      const $ = cheerio.load(html);

      let posterUrl = $('img.postImg').attr('src');

      if (posterUrl) {
        console.log(`  ✅ Found poster via scraping: ${posterUrl}`);
        if (posterUrl.startsWith('//')) {
          posterUrl = 'https:' + posterUrl;
        } else if (posterUrl.startsWith('/')) {
          const urlObj = new URL(url);
          posterUrl = urlObj.origin + posterUrl;
        }
        return posterUrl;
      }
      console.log('  🟡 No poster found via scraping.');
      return null;
    } catch (error) {
      console.error(`❌ Error scraping page ${url}: ${error.message}`);
      return null;
    }
  }

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
    if (typeof torrentInfo.size === 'string') {
        const sizeMatch = torrentInfo.size.match(/(\d+\.?\d*\s*(GB|MB))/i);
        if (sizeMatch) subText += `${sizeMatch[1]}`;
    }

    if (torrentInfo.seeders > 0) {
        if (subText) subText += ' | ';
        subText += `🌱${torrentInfo.seeders}`;
    }

    const posterUrl = `https://fakeimg.pl/300x450/${color}/?text=${encodeURIComponent(mainText)}&font_size=40&font=bebas&data=${encodeURIComponent(subText)}`;
    return { poster: posterUrl, rating: null };
  }

  async getPosterUrl(torrentName, torrentInfo, userConfig = {}) {
    const cacheKey = `poster_v2_${torrentName}`;
    const cached = this.cache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < this.cacheExpiry) {
      return cached.data;
    }

    let posterData = null;
    try {
      if (userConfig.enableThePornDB && userConfig.theporndbApiKey) {
        const { searchQuery } = this.extractSearchTerms(torrentName);
        posterData = await this.searchThePornDB(searchQuery, userConfig.theporndbApiKey);
        await new Promise(resolve => setTimeout(resolve, 250)); // Rate limit
      }

      if (!posterData && torrentInfo.poster) {
        console.log(`✅ Using 1337x poster for "${torrentName.substring(0, 30)}"`);
        posterData = { poster: torrentInfo.poster, rating: null };
      }

      if (!posterData && torrentInfo.link) {
        const scrapedPoster = await this.scrapePosterFromUrl(torrentInfo.link);
        if (scrapedPoster) {
          posterData = { poster: scrapedPoster, rating: null };
        }
      }

      if (!posterData) {
        posterData = this.generateEnhancedPoster(torrentName, torrentInfo);
      }
      
      this.cache.set(cacheKey, { data: posterData, timestamp: Date.now() });
      return posterData;
    } catch (error) {
      console.error('❌ Poster service error:', error);
      return this.generateEnhancedPoster(torrentName, torrentInfo);
    }
  }
}

module.exports = new PosterService();
