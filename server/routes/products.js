const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { searchProducts, getProductById, comparePrices, getAllProducts } = require('../controllers/productController');
const { validateSearch, validateLocation } = require('../middleware/validation');
const { cacheMiddleware } = require('../middleware/cache');

// Get all products explicitly to stop 404 Route Not Found errors
router.get('/', cacheMiddleware(60), getAllProducts);

// Search products
router.get('/search', validateSearch, validateLocation, cacheMiddleware(30), searchProducts);

// Get product by ID
router.get('/:id', getProductById);

// Compare prices for a specific product
router.get('/:id/compare', cacheMiddleware(60), comparePrices);

// Get popular products
router.get('/popular/:city', cacheMiddleware(120), async (req, res) => {
  try {
    const { city } = req.params;
    const { limit = 10 } = req.query;
    
    const products = await Product.getPopularProducts(city, parseInt(limit));
    
    res.json({
      success: true,
      data: products,
      count: products.length
    });
  } catch (error) {
    console.error('Error fetching popular products:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch popular products'
    });
  }
});

// Get categories
router.get('/categories/:city', cacheMiddleware(300), async (req, res) => {
  try {
    const { city } = req.params;
    
    const categories = await Product.distinct('category', {
      'location.city': city.toLowerCase()
    });
    
    res.json({
      success: true,
      data: categories.sort(),
      count: categories.length
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories'
    });
  }
});

// Get brands
router.get('/brands/:city', cacheMiddleware(300), async (req, res) => {
  try {
    const { city } = req.params;
    const { category } = req.query;
    
    const query = { 'location.city': city.toLowerCase() };
    if (category) {
      query.category = category;
    }
    
    const brands = await Product.distinct('brand', query);
    
    res.json({
      success: true,
      data: brands.sort(),
      count: brands.length
    });
  } catch (error) {
    console.error('Error fetching brands:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch brands'
    });
  }
});

module.exports = router;
