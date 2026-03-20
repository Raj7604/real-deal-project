const express = require('express');
const router = express.Router();
const intelligenceService = require('../services/intelligenceService');
const UserBehavior = require('../models/UserBehavior');
const PriceInsight = require('../models/PriceInsight');
const { validateSearch, validateLocation } = require('../middleware/validation');

// Get price insights for a product
router.get('/insights/:productId', validateLocation, async (req, res) => {
  try {
    const { productId } = req.params;
    const { city, pincode } = req.query;

    if (!city || !pincode) {
      return res.status(400).json({
        success: false,
        error: 'City and pincode are required'
      });
    }

    const location = { city, pincode };
    
    // Generate or get cached insights
    const insights = await intelligenceService.generatePriceInsights(productId, location);
    
    res.json({
      success: true,
      data: insights,
      productId,
      location
    });
  } catch (error) {
    console.error('Error getting price insights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get price insights'
    });
  }
});

// Enhanced search with AI-powered suggestions
router.post('/enhanced-search', validateSearch, validateLocation, async (req, res) => {
  try {
    const { query, city, pincode } = req.body;
    const location = { city, pincode };

    // Enhance search query with synonyms and suggestions
    const enhancements = await intelligenceService.enhanceSearchQuery(query, location);
    
    res.json({
      success: true,
      data: {
        originalQuery: query,
        enhancements,
        location
      }
    });
  } catch (error) {
    console.error('Error in enhanced search:', error);
    res.status(500).json({
      success: false,
      error: 'Enhanced search failed'
    });
  }
});

// Get platform intelligence for location
router.get('/platform-intelligence/:city/:pincode', async (req, res) => {
  try {
    const { city, pincode } = req.params;
    const { category } = req.query;

    const location = { city, pincode };
    const intelligence = await intelligenceService.analyzePlatformPreferences(location, category);
    
    res.json({
      success: true,
      data: intelligence,
      location
    });
  } catch (error) {
    console.error('Error getting platform intelligence:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get platform intelligence'
    });
  }
});

// Get personalized recommendations
router.get('/recommendations/:sessionId', validateLocation, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { city, pincode, limit = 10 } = req.query;

    const location = { city, pincode };
    
    const recommendations = await intelligenceService.getPersonalizedRecommendations(
      sessionId, 
      location, 
      parseInt(limit)
    );
    
    res.json({
      success: true,
      data: recommendations,
      sessionId,
      location
    });
  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get recommendations'
    });
  }
});

// Track user behavior
router.post('/track/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { eventType, data } = req.body;
    const { city, pincode } = req.query;

    if (!eventType || !data) {
      return res.status(400).json({
        success: false,
        error: 'Event type and data are required'
      });
    }

    const location = { city, pincode };
    
    await UserBehavior.trackEvent(sessionId, location, eventType, data);
    
    res.json({
      success: true,
      message: 'Event tracked successfully'
    });
  } catch (error) {
    console.error('Error tracking user behavior:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track event'
    });
  }
});

// Update user preferences
router.post('/preferences/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { preferences } = req.body;

    if (!preferences) {
      return res.status(400).json({
        success: false,
        error: 'Preferences are required'
      });
    }

    await UserBehavior.updatePreferences(sessionId, preferences);
    
    res.json({
      success: true,
      message: 'Preferences updated successfully'
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update preferences'
    });
  }
});

// Get price trends for multiple products
router.post('/trends', validateLocation, async (req, res) => {
  try {
    const { productIds, city, pincode, period = 'week' } = req.body;
    const location = { city, pincode };

    if (!productIds || !Array.isArray(productIds)) {
      return res.status(400).json({
        success: false,
        error: 'Product IDs array is required'
      });
    }

    const trends = {};
    
    for (const productId of productIds) {
      trends[productId] = await intelligenceService.analyzePriceTrends(productId, location, period);
    }

    res.json({
      success: true,
      data: trends,
      location,
      period
    });
  } catch (error) {
    console.error('Error getting price trends:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get price trends'
    });
  }
});

// Get best time to buy recommendations
router.get('/best-time-to-buy/:productId', validateLocation, async (req, res) => {
  try {
    const { productId } = req.params;
    const { city, pincode } = req.query;

    const location = { city, pincode };
    
    const timing = await intelligenceService.analyzeBestTimeToBuy(productId, location);
    
    if (!timing) {
      return res.json({
        success: true,
        data: null,
        message: 'Insufficient data to analyze best time to buy'
      });
    }

    res.json({
      success: true,
      data: timing,
      productId,
      location
    });
  } catch (error) {
    console.error('Error getting best time to buy:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get best time to buy analysis'
    });
  }
});

// Get market insights for location
router.get('/market-insights/:city/:pincode', async (req, res) => {
  try {
    const { city, pincode } = req.params;
    const location = { city, pincode };

    // Get various insights for the location
    const [
      platformIntelligence,
      recentInsights
    ] = await Promise.all([
        intelligenceService.analyzePlatformPreferences(location),
        PriceInsight.getInsightsByType(location, 'price_trend', 5)
      ]);

    res.json({
      success: true,
      data: {
        platformIntelligence,
        recentInsights,
        location
      }
    });
  } catch (error) {
    console.error('Error getting market insights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get market insights'
    });
  }
});

// Clear intelligence cache (admin endpoint)
router.post('/cache/clear', async (req, res) => {
  try {
    intelligenceService.clearCache();
    const stats = intelligenceService.getCacheStats();
    
    res.json({
      success: true,
      message: 'Intelligence cache cleared',
      data: stats
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear cache'
    });
  }
});

module.exports = router;
