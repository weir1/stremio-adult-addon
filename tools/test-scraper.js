const Scraper1337x = require('../src/scrapers/1337x');

async function testScraper() {
  const scraper = new Scraper1337x();
  console.log('Testing trending scraper...');
  const trending = await scraper.scrapeTrending();
  console.log('Trending torrents:', trending);

  console.log('Testing popular scraper...');
  const popular = await scraper.scrapePopular();
  console.log('Popular torrents:', popular);
}

testScraper();