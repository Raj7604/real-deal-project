const scrapingService = require('../services/scrapingService');
const database = require('../utils/database');

// On-demand scraping script - doesn't block server startup
async function runScraping() {
  try {
    console.log('🔌 Connecting to database for scraping...');
    await database.connect();
    
    console.log('🕷️ Starting scraping process...');
    
    // Example: Scrape all platforms for Bangalore
    const location = {
      city: 'Bangalore',
      pincode: '560001'
    };
    
    const results = await scrapingService.scrapeAllPlatforms(location);
    
    console.log('✅ Scraping completed:', results);
    
  } catch (error) {
    console.error('❌ Scraping failed:', error);
  } finally {
    await database.disconnect();
    process.exit(0);
  }
}

// Run scraping only when this script is executed directly
if (require.main === module) {
  runScraping();
}

module.exports = { runScraping };
