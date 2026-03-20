const ScrapingLog = require('../models/ScrapingLog');
const { scrapeAllPlatforms, scrapePlatform } = require('../services/scrapingService');

// Trigger manual scraping
const triggerScraping = async (req, res) => {
  try {
    const { platform, city, pincode, categories } = req.body;
    
    // Validate platform if provided
    if (platform && !['blinkit', 'zepto', 'instamart', 'bigbasket'].includes(platform)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid platform. Must be one of: blinkit, zepto, instamart, bigbasket'
      });
    }
    
    // Create scraping log entry
    const scrapingLog = new ScrapingLog({
      platform: platform || 'all',
      location: {
        city: city || 'Bangalore',
        pincode: pincode || '560001'
      },
      status: 'running',
      startTime: new Date(),
      metadata: {
        categories: categories || [],
        userAgent: req.get('User-Agent')
      }
    });
    
    await scrapingLog.save();
    
    // Start scraping in background
    if (platform) {
      scrapePlatform(platform, city, pincode, categories, scrapingLog._id)
        .catch(error => {
          console.error(`Error scraping ${platform}:`, error);
        });
    } else {
      scrapeAllPlatforms(city, pincode, categories, scrapingLog._id)
        .catch(error => {
          console.error('Error scraping all platforms:', error);
        });
    }
    
    res.json({
      success: true,
      message: 'Scraping initiated',
      logId: scrapingLog._id,
      platform: platform || 'all',
      location: { city, pincode }
    });
  } catch (error) {
    console.error('Error triggering scraping:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger scraping'
    });
  }
};

// Get scraping status
const getScrapingStatus = async (req, res) => {
  try {
    const { platform, city, logId } = req.query;
    
    let query = {};
    if (platform) query.platform = platform;
    if (city) query['location.city'] = city;
    if (logId) query._id = logId;
    
    // Get the most recent scraping log
    const log = await ScrapingLog.findOne(query)
      .sort({ startTime: -1 })
      .limit(1);
    
    if (!log) {
      return res.status(404).json({
        success: false,
        error: 'No scraping logs found'
      });
    }
    
    // Calculate duration if still running
    let duration = log.duration;
    if (log.status === 'running' && log.startTime) {
      duration = Date.now() - log.startTime.getTime();
    }
    
    res.json({
      success: true,
      data: {
        ...log.toObject(),
        duration,
        isRunning: log.status === 'running'
      }
    });
  } catch (error) {
    console.error('Error getting scraping status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get scraping status'
    });
  }
};

// Get scraping statistics
const getScrapingStats = async (req, res) => {
  try {
    const { city, platform, days = 7 } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    const matchQuery = {
      startTime: { $gte: startDate }
    };
    
    if (city) matchQuery['location.city'] = city;
    if (platform) matchQuery.platform = platform;
    
    const stats = await ScrapingLog.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalRuns: { $sum: 1 },
          successfulRuns: {
            $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
          },
          failedRuns: {
            $sum: { $cond: [{ $eq: ['$status', 'error'] }, 1, 0] }
          },
          avgDuration: { $avg: '$duration' },
          totalProductsScraped: { $sum: '$productsScraped' },
          totalProductsUpdated: { $sum: '$productsUpdated' },
          totalProductsAdded: { $sum: '$productsAdded' }
        }
      }
    ]);
    
    const result = stats[0] || {
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0,
      avgDuration: 0,
      totalProductsScraped: 0,
      totalProductsUpdated: 0,
      totalProductsAdded: 0
    };
    
    // Calculate success rate
    result.successRate = result.totalRuns > 0 
      ? ((result.successfulRuns / result.totalRuns) * 100).toFixed(1)
      : 0;
    
    res.json({
      success: true,
      data: result,
      period: `${days} days`,
      generatedAt: new Date()
    });
  } catch (error) {
    console.error('Error getting scraping stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get scraping statistics'
    });
  }
};

module.exports = {
  triggerScraping,
  getScrapingStatus,
  getScrapingStats
};
