const express = require('express');
const router = express.Router();
const ScrapingLog = require('../models/ScrapingLog');
const { triggerScraping, getScrapingStatus } = require('../controllers/scrapingController');

// Trigger manual scraping
router.post('/trigger', triggerScraping);

// Get scraping status
router.get('/status', getScrapingStatus);

// Get scraping logs
router.get('/logs', async (req, res) => {
  try {
    const { 
      platform, 
      city, 
      status, 
      limit = 50, 
      page = 1 
    } = req.query;
    
    const query = {};
    if (platform) query.platform = platform;
    if (city) query['location.city'] = city;
    if (status) query.status = status;
    
    const logs = await ScrapingLog.find(query)
      .sort({ startTime: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await ScrapingLog.countDocuments(query);
    
    res.json({
      success: true,
      data: logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching scraping logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch scraping logs'
    });
  }
});

// Get scraping statistics
router.get('/stats', async (req, res) => {
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
          _id: {
            platform: '$platform',
            status: '$status'
          },
          count: { $sum: 1 },
          avgDuration: { $avg: '$duration' },
          totalProductsScraped: { $sum: '$productsScraped' },
          totalProductsUpdated: { $sum: '$productsUpdated' },
          totalProductsAdded: { $sum: '$productsAdded' }
        }
      },
      {
        $group: {
          _id: '$_id.platform',
          stats: {
            $push: {
              status: '$_id.status',
              count: '$count',
              avgDuration: '$avgDuration',
              totalProductsScraped: '$totalProductsScraped',
              totalProductsUpdated: '$totalProductsUpdated',
              totalProductsAdded: '$totalProductsAdded'
            }
          },
          totalRuns: { $sum: '$count' }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: stats,
      period: `${days} days`,
      generatedAt: new Date()
    });
  } catch (error) {
    console.error('Error fetching scraping stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch scraping statistics'
    });
  }
});

module.exports = router;
