const cron = require('node-cron');
const database = require('../utils/database');
const { scrapeAllPlatforms, scrapePlatform } = require('../services/scrapingService');
const ScrapingLog = require('../models/ScrapingLog');
const Product = require('../models/Product');

// Configuration from environment variables
const HIGH_PRIORITY_INTERVAL = process.env.SCRAPING_INTERVAL_HIGH || 15; // minutes
const MEDIUM_PRIORITY_INTERVAL = process.env.SCRAPING_INTERVAL_MEDIUM || 60; // minutes
const LOW_PRIORITY_INTERVAL = process.env.SCRAPING_INTERVAL_LOW || 240; // minutes

// Default locations to scrape
const DEFAULT_LOCATIONS = [
  { city: 'Bangalore', pincode: '560001' },
  { city: 'Delhi', pincode: '110001' },
  { city: 'Mumbai', pincode: '400001' },
  { city: 'Chennai', pincode: '600001' },
  { city: 'Kolkata', pincode: '700001' }
];

// High priority categories (scraped frequently)
const HIGH_PRIORITY_CATEGORIES = [
  'milk', 'bread', 'eggs', 'vegetables', 'fruits'
];

// Medium priority categories
const MEDIUM_PRIORITY_CATEGORIES = [
  'rice', 'flour', 'oil', 'sugar', 'salt', 'dairy', 'pulses'
];

// Low priority categories
const LOW_PRIORITY_CATEGORIES = [
  'snacks', 'beverages', 'personal care', 'cleaning', 'spices'
];

class ScrapingScheduler {
  constructor() {
    this.jobs = new Map();
    this.isRunning = false;
  }

  async start() {
    if (this.isRunning) {
      console.log('⚠️ Scheduler is already running');
      return;
    }

    try {
      await database.connect();
      this.isRunning = true;
      
      console.log('🚀 Starting scraping scheduler...');
      
      // Schedule high priority scraping (every 15 minutes)
      this.scheduleJob(
        'high-priority',
        `*/${HIGH_PRIORITY_INTERVAL} * * * *`,
        () => this.scrapeHighPriority(),
        `High priority scraping (every ${HIGH_PRIORITY_INTERVAL} minutes)`
      );

      // Schedule medium priority scraping (every hour)
      this.scheduleJob(
        'medium-priority',
        `0 */${MEDIUM_PRIORITY_INTERVAL} * * *`,
        () => this.scrapeMediumPriority(),
        `Medium priority scraping (every ${MEDIUM_PRIORITY_INTERVAL} minutes)`
      );

      // Schedule low priority scraping (every 4 hours)
      this.scheduleJob(
        'low-priority',
        `0 */${LOW_PRIORITY_INTERVAL} * * *`,
        () => this.scrapeLowPriority(),
        `Low priority scraping (every ${LOW_PRIORITY_INTERVAL} minutes)`
      );

      // Schedule daily cleanup (at 2 AM)
      this.scheduleJob(
        'daily-cleanup',
        '0 2 * * *',
        () => this.dailyCleanup(),
        'Daily cleanup and maintenance'
      );

      // Schedule weekly full scrape (Sunday at 3 AM)
      this.scheduleJob(
        'weekly-full-scrape',
        '0 3 * * 0',
        () => this.weeklyFullScrape(),
        'Weekly full scrape'
      );

      console.log('✅ Scraping scheduler started successfully');
      console.log(`📍 Active locations: ${DEFAULT_LOCATIONS.map(l => l.city).join(', ')}`);
      console.log(`⏰ High priority: every ${HIGH_PRIORITY_INTERVAL} minutes`);
      console.log(`⏰ Medium priority: every ${MEDIUM_PRIORITY_INTERVAL} minutes`);
      console.log(`⏰ Low priority: every ${LOW_PRIORITY_INTERVAL} minutes`);

    } catch (error) {
      console.error('❌ Failed to start scheduler:', error);
      this.isRunning = false;
      throw error;
    }
  }

  scheduleJob(name, cronExpression, task, description) {
    if (this.jobs.has(name)) {
      console.log(`⚠️ Job '${name}' already exists, skipping...`);
      return;
    }

    const job = cron.schedule(cronExpression, task, {
      scheduled: false,
      timezone: 'Asia/Kolkata'
    });

    job.start();
    this.jobs.set(name, { job, description, cronExpression });
    
    console.log(`📅 Scheduled job: ${description} (${cronExpression})`);
  }

  async scrapeHighPriority() {
    console.log('🔄 Starting high priority scraping...');
    
    for (const location of DEFAULT_LOCATIONS) {
      try {
        await this.scrapeWithRetry('all', location.city, location.pincode, HIGH_PRIORITY_CATEGORIES, 3);
      } catch (error) {
        console.error(`❌ High priority scraping failed for ${location.city}:`, error);
      }
    }
    
    console.log('✅ High priority scraping completed');
  }

  async scrapeMediumPriority() {
    console.log('🔄 Starting medium priority scraping...');
    
    for (const location of DEFAULT_LOCATIONS) {
      try {
        await this.scrapeWithRetry('all', location.city, location.pincode, MEDIUM_PRIORITY_CATEGORIES, 2);
      } catch (error) {
        console.error(`❌ Medium priority scraping failed for ${location.city}:`, error);
      }
    }
    
    console.log('✅ Medium priority scraping completed');
  }

  async scrapeLowPriority() {
    console.log('🔄 Starting low priority scraping...');
    
    for (const location of DEFAULT_LOCATIONS) {
      try {
        await this.scrapeWithRetry('all', location.city, location.pincode, LOW_PRIORITY_CATEGORIES, 1);
      } catch (error) {
        console.error(`❌ Low priority scraping failed for ${location.city}:`, error);
      }
    }
    
    console.log('✅ Low priority scraping completed');
  }

  async scrapeWithRetry(platform, city, pincode, categories, maxRetries = 3) {
    let lastError = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const log = new ScrapingLog({
          platform: platform || 'all',
          location: { city, pincode },
          status: 'running',
          startTime: new Date(),
          metadata: {
            categories,
            attempt,
            maxRetries
          }
        });
        
        await log.save();
        
        if (platform === 'all') {
          await scrapeAllPlatforms(city, pincode, categories, log._id);
        } else {
          await scrapePlatform(platform, city, pincode, categories, log._id);
        }
        
        return; // Success, exit retry loop
        
      } catch (error) {
        lastError = error;
        console.error(`❌ Scraping attempt ${attempt}/${maxRetries} failed:`, error.message);
        
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 30000); // Exponential backoff, max 30s
          console.log(`⏳ Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }

  async dailyCleanup() {
    console.log('🧹 Starting daily cleanup...');
    
    try {
      // Clean up old scraping logs (keep last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const deletedLogs = await ScrapingLog.deleteMany({
        startTime: { $lt: sevenDaysAgo }
      });
      
      console.log(`🗑️ Deleted ${deletedLogs.deletedCount} old scraping logs`);
      
      // Update product priorities based on recent searches
      await this.updateProductPriorities();
      
      // Remove outdated products (no updates in 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const outdatedProducts = await Product.deleteMany({
        lastScraped: { $lt: thirtyDaysAgo }
      });
      
      console.log(`🗑️ Removed ${outdatedProducts.deletedCount} outdated products`);
      
      console.log('✅ Daily cleanup completed');
      
    } catch (error) {
      console.error('❌ Daily cleanup failed:', error);
    }
  }

  async weeklyFullScrape() {
    console.log('🔄 Starting weekly full scrape...');
    
    const allCategories = [...HIGH_PRIORITY_CATEGORIES, ...MEDIUM_PRIORITY_CATEGORIES, ...LOW_PRIORITY_CATEGORIES];
    
    for (const location of DEFAULT_LOCATIONS) {
      try {
        console.log(`🌍 Full scraping for ${location.city}...`);
        await this.scrapeWithRetry('all', location.city, location.pincode, allCategories, 5);
      } catch (error) {
        console.error(`❌ Weekly full scrape failed for ${location.city}:`, error);
      }
    }
    
    console.log('✅ Weekly full scrape completed');
  }

  async updateProductPriorities() {
    try {
      // This would typically be based on search analytics
      // For now, we'll keep the current priorities
      
      console.log('📊 Product priorities updated');
    } catch (error) {
      console.error('❌ Failed to update product priorities:', error);
    }
  }

  stop() {
    if (!this.isRunning) {
      console.log('⚠️ Scheduler is not running');
      return;
    }

    console.log('🛑 Stopping scraping scheduler...');
    
    this.jobs.forEach((jobData, name) => {
      jobData.job.stop();
      console.log(`⏹️ Stopped job: ${jobData.description}`);
    });
    
    this.jobs.clear();
    this.isRunning = false;
    
    console.log('✅ Scraping scheduler stopped');
  }

  getStatus() {
    const status = {
      isRunning: this.isRunning,
      activeJobs: [],
      nextRuns: {}
    };

    this.jobs.forEach((jobData, name) => {
      status.activeJobs.push({
        name,
        description: jobData.description,
        cronExpression: jobData.cronExpression,
        isRunning: jobData.job.running
      });
    });

    return status;
  }

  async getRecentLogs(limit = 10) {
    try {
      const logs = await ScrapingLog.find()
        .sort({ startTime: -1 })
        .limit(limit);
      
      return logs;
    } catch (error) {
      console.error('❌ Failed to get recent logs:', error);
      return [];
    }
  }
}

// Create and export scheduler instance
const scheduler = new ScrapingScheduler();

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, stopping scheduler...');
  scheduler.stop();
});

process.on('SIGINT', () => {
  console.log('SIGINT received, stopping scheduler...');
  scheduler.stop();
});

// Start scheduler if this file is run directly
if (require.main === module) {
  scheduler.start().catch(error => {
    console.error('❌ Failed to start scheduler:', error);
    process.exit(1);
  });
}

module.exports = scheduler;
