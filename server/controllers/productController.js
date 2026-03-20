const Product = require('../models/Product');
const { normalizeProductName, calculateSimilarity } = require('../services/productNormalization');

// Search products
const searchProducts = async (req, res) => {
  try {
    const { q: query, city, category, brand, sortBy = 'relevance', limit = 20, page = 1 } = req.query;
    
    if (!query || !city) {
      return res.status(400).json({
        success: false,
        error: 'Search query and city are required'
      });
    }
    
    const options = {
      category,
      brand,
      sortBy,
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit)
    };
    
    const products = await Product.searchProducts(query, city, options);
    
    // Check staleness and trigger background update if necessary
    const THIRTY_MINUTES = 30 * 60 * 1000;
    const now = Date.now();
    let isStale = false;
    
    if (products.length > 0) {
      const oldestScrape = products.reduce((oldest, p) => 
        (p.lastScraped < oldest ? p.lastScraped : oldest), 
        products[0].lastScraped
      );

      if (now - new Date(oldestScrape).getTime() > THIRTY_MINUTES) {
        isStale = true;
      }
    } else {
      isStale = true; // missing data means stale
    }

    if (isStale) {
      // Trigger background update asynchronously (fire and forget)
      const { scrapeAllPlatforms } = require('../services/scrapingService');
      const Location = require('../models/Location');
      Location.findOne({ city }).then(loc => {
        if (loc) {
          console.log(`📡 Background scrape triggered for stale/missing data in ${city}`);
          scrapeAllPlatforms(loc.city, loc.pincode, [query]).catch(err => console.error("Background scrape error:", err));
        }
      });
    }
    
    // Enhance products with comparison data
    const enhancedProducts = products.map(product => {
      const productObj = product.toObject();
      
      // Add cheapest platform info
      const cheapest = productObj.cheapestPrice;
      if (cheapest) {
        productObj.cheapestPlatform = cheapest.platform;
        productObj.cheapestPrice = cheapest.price;
        productObj.savings = productObj.maxSavings;
      }
      
      // Calculate savings percentage
      if (productObj.priceRange && productObj.priceRange.min > 0) {
        productObj.savingsPercentage = ((productObj.priceRange.difference / productObj.priceRange.max) * 100).toFixed(1);
      }
      
      productObj.lastUpdated = productObj.lastScraped; // attach timestamp seamlessly
      
      return productObj;
    });
    
    res.json({
      success: true,
      data: enhancedProducts,
      query,
      city,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: enhancedProducts.length
      }
    });
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search products'
    });
  }
};

// Get product by ID
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    
    const productObj = product.toObject();
    
    // Add comparison data
    const cheapest = productObj.cheapestPrice;
    if (cheapest) {
      productObj.cheapestPlatform = cheapest.platform;
      productObj.cheapestPrice = cheapest.price;
      productObj.savings = productObj.maxSavings;
    }
    
    if (productObj.priceRange && productObj.priceRange.min > 0) {
      productObj.savingsPercentage = ((productObj.priceRange.difference / productObj.priceRange.max) * 100).toFixed(1);
    }
    
    res.json({
      success: true,
      data: productObj
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch product'
    });
  }
};

// Compare prices for a specific product
const comparePrices = async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    
    // Sort platforms by price
    const sortedPlatforms = [...product.platforms]
      .filter(p => p.availability)
      .sort((a, b) => a.price - b.price);
    
    // Calculate savings for each platform
    const platformsWithSavings = sortedPlatforms.map((platform, index) => {
      const cheapestPrice = sortedPlatforms[0].price;
      const savings = platform.price - cheapestPrice;
      const savingsPercentage = cheapestPrice > 0 ? ((savings / platform.price) * 100).toFixed(1) : 0;
      
      return {
        ...platform.toObject(),
        isCheapest: index === 0,
        savings: savings > 0 ? savings : 0,
        savingsPercentage: savings > 0 ? parseFloat(savingsPercentage) : 0,
        rank: index + 1
      };
    });
    
    res.json({
      success: true,
      data: {
        product: {
          id: product._id,
          name: product.name,
          brand: product.brand,
          category: product.category,
          quantity: product.quantity,
          unit: product.unit,
          image: product.image,
          location: product.location
        },
        platforms: platformsWithSavings,
        priceRange: product.priceRange,
        maxSavings: product.maxSavings,
        totalPlatforms: platformsWithSavings.length
      }
    });
  } catch (error) {
    console.error('Error comparing prices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to compare prices'
    });
  }
};

// Get product suggestions (autocomplete)
const getProductSuggestions = async (req, res) => {
  try {
    const { q: query, city, limit = 10 } = req.query;
    
    if (!query || !city) {
      return res.status(400).json({
        success: false,
        error: 'Query and city are required'
      });
    }
    
    const suggestions = await Product.find({
      'location.city': city.toLowerCase(),
      $or: [
        { normalizedSearchKey: { $regex: query.toLowerCase(), $options: 'i' } },
        { name: { $regex: query, $options: 'i' } },
        { brand: { $regex: query, $options: 'i' } }
      ]
    })
    .select('name brand category image')
    .limit(parseInt(limit))
    .lean();
    
    res.json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    console.error('Error getting suggestions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get suggestions'
    });
  }
};

// Get all products (paginated)
const getAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 20, city, category, brand } = req.query;
    
    const query = {};
    if (city) query['location.city'] = city.toLowerCase();
    if (category) query.category = category;
    if (brand) query.brand = brand;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
      
    const total = await Product.countDocuments(query);
    
    // Attach cheapest platform and timestamp logically analogous to search endpoint
    const enhancedProducts = products.map(product => {
      const cheapest = product.cheapestPrice;
      if (cheapest) {
        product.cheapestPlatform = cheapest.platform;
        product.cheapestPrice = cheapest.price;
        product.savings = product.maxSavings;
      }
      product.lastUpdated = product.lastScraped;
      return product;
    });
    
    res.json({
      success: true,
      data: enhancedProducts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching all products:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch products'
    });
  }
};

module.exports = {
  searchProducts,
  getProductById,
  comparePrices,
  getProductSuggestions,
  getAllProducts
};
