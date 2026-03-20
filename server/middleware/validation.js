// Validate search query
const validateSearch = (req, res, next) => {
  const { q: query } = req.query;
  
  if (!query || query.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Search query is required'
    });
  }
  
  if (query.length < 2) {
    return res.status(400).json({
      success: false,
      error: 'Search query must be at least 2 characters long'
    });
  }
  
  if (query.length > 100) {
    return res.status(400).json({
      success: false,
      error: 'Search query must be less than 100 characters'
    });
  }
  
  next();
};

// Validate location
const validateLocation = (req, res, next) => {
  const { city, pincode } = req.query;
  
  if (!city || city.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'City is required'
    });
  }
  
  // Basic city validation
  if (!/^[a-zA-Z\s]+$/.test(city.trim())) {
    return res.status(400).json({
      success: false,
      error: 'Invalid city format'
    });
  }
  
  // Validate pincode if provided
  if (pincode && !/^\d{6}$/.test(pincode)) {
    return res.status(400).json({
      success: false,
      error: 'Pincode must be exactly 6 digits'
    });
  }
  
  next();
};

// Validate product data
const validateProductData = (req, res, next) => {
  const { name, brand, category, quantity, unit, platforms } = req.body;
  
  if (!name || name.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Product name is required'
    });
  }
  
  if (!brand || brand.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Brand is required'
    });
  }
  
  if (!category || category.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Category is required'
    });
  }
  
  if (!quantity || quantity <= 0) {
    return res.status(400).json({
      success: false,
      error: 'Quantity must be greater than 0'
    });
  }
  
  if (!unit || !['g', 'ml', 'pcs', 'kg', 'l'].includes(unit)) {
    return res.status(400).json({
      success: false,
      error: 'Unit must be one of: g, ml, pcs, kg, l'
    });
  }
  
  if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'At least one platform is required'
    });
  }
  
  // Validate each platform
  const validPlatforms = ['blinkit', 'zepto', 'instamart', 'bigbasket'];
  for (const platform of platforms) {
    if (!validPlatforms.includes(platform.platform)) {
      return res.status(400).json({
        success: false,
        error: `Invalid platform: ${platform.platform}. Must be one of: ${validPlatforms.join(', ')}`
      });
    }
    
    if (!platform.price || platform.price <= 0) {
      return res.status(400).json({
        success: false,
        error: `Price is required and must be greater than 0 for platform ${platform.platform}`
      });
    }
    
    if (!platform.originalName || platform.originalName.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: `Original name is required for platform ${platform.platform}`
      });
    }
  }
  
  next();
};

// Validate scraping request
const validateScrapingRequest = (req, res, next) => {
  const { platform, city, pincode } = req.body;
  
  if (platform && !['blinkit', 'zepto', 'instamart', 'bigbasket'].includes(platform)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid platform. Must be one of: blinkit, zepto, instamart, bigbasket'
    });
  }
  
  if (!city || city.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'City is required'
    });
  }
  
  if (pincode && !/^\d{6}$/.test(pincode)) {
    return res.status(400).json({
      success: false,
      error: 'Pincode must be exactly 6 digits'
    });
  }
  
  next();
};

// Rate limiting middleware
const createRateLimiter = (windowMs, max) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    // Clean old entries
    for (const [ip, data] of requests.entries()) {
      if (now - data.firstRequest > windowMs) {
        requests.delete(ip);
      }
    }
    
    const requestData = requests.get(key);
    
    if (!requestData) {
      requests.set(key, {
        count: 1,
        firstRequest: now
      });
      return next();
    }
    
    if (requestData.count >= max) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests, please try again later'
      });
    }
    
    requestData.count++;
    next();
  };
};

// Create rate limiters for different endpoints
const searchRateLimit = createRateLimiter(15 * 60 * 1000, 100); // 100 requests per 15 minutes
const scrapingRateLimit = createRateLimiter(60 * 60 * 1000, 10); // 10 requests per hour

module.exports = {
  validateSearch,
  validateLocation,
  validateProductData,
  validateScrapingRequest,
  searchRateLimit,
  scrapingRateLimit
};
