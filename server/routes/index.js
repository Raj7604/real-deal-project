const express = require('express');
const router = express.Router();

// API Index Route
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'RealDeal API v1.0.0',
    status: 'operational',
    timestamp: new Date().toISOString(),
    endpoints: {
      products: {
        search: 'GET /api/products/search?q=query&city=city',
        getById: 'GET /api/products/:id',
        compare: 'GET /api/products/:id/compare',
        popular: 'GET /api/products/popular/:city',
        categories: 'GET /api/products/categories/:city',
        brands: 'GET /api/products/brands/:city'
      },
      locations: {
        cities: 'GET /api/locations/cities',
        getByPincode: 'GET /api/locations/pincode/:pincode',
        platformSupport: 'GET /api/locations/platform-support/:city/:platform'
      },
      scraping: {
        trigger: 'POST /api/scrape/trigger',
        status: 'GET /api/scrape/status',
        logs: 'GET /api/scrape/logs',
        stats: 'GET /api/scrape/stats'
      },
      intelligence: {
        insights: 'GET /api/intelligence/insights/:productId',
        enhancedSearch: 'POST /api/intelligence/enhanced-search',
        platformIntelligence: 'GET /api/intelligence/platform-intelligence/:city/:pincode',
        recommendations: 'GET /api/intelligence/recommendations/:sessionId',
        track: 'POST /api/intelligence/track/:sessionId',
        trends: 'POST /api/intelligence/trends'
      }
    },
    documentation: '/api'
  });
});

module.exports = router;
