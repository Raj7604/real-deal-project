const mongoose = require('mongoose');

const platformPriceSchema = new mongoose.Schema({
  platform: {
    type: String,
    required: true,
    enum: ['blinkit', 'zepto', 'instamart', 'bigbasket']
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  originalName: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    default: null
  },
  productUrl: {
    type: String,
    default: null
  },
  deliveryTime: {
    type: String,
    default: null
  },
  availability: {
    type: Boolean,
    default: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  currency: {
    type: String,
    default: 'INR'
  }
});

const locationSchema = new mongoose.Schema({
  city: {
    type: String,
    required: true,
    default: 'Bangalore'
  },
  pincode: {
    type: String,
    required: true,
    default: '560001'
  },
  state: {
    type: String,
    default: null
  }
});

const productSchema = new mongoose.Schema({
  // Normalized product information
  name: {
    type: String,
    required: true,
    trim: true
  },
  normalizedSearchKey: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  brand: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  
  // Quantity information (standardized)
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    required: true,
    enum: ['g', 'ml', 'pcs', 'kg', 'l']
  },
  standardizedQuantity: {
    type: Number, // Always in grams or milliliters
    required: true
  },
  standardizedUnit: {
    type: String,
    required: true,
    enum: ['g', 'ml']
  },
  
  // Visual information
  image: {
    type: String,
    default: null
  },
  description: {
    type: String,
    default: null
  },
  
  // Platform-specific pricing
  platforms: [platformPriceSchema],
  
  // Location information
  location: {
    type: locationSchema,
    required: true
  },
  
  // Metadata
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
  tags: [{
    type: String,
    lowercase: true,
    trim: true
  }],
  
  // Timestamps
  lastScraped: {
    type: Date,
    default: Date.now
  },
  priceHistory: [{
    platform: String,
    price: Number,
    date: Date
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better search performance
productSchema.index({ normalizedSearchKey: 1, 'location.city': 1 });
productSchema.index({ category: 1, 'location.city': 1 });
productSchema.index({ brand: 1, 'location.city': 1 });
productSchema.index({ name: 'text', 'platforms.originalName': 'text' });
productSchema.index({ 'platforms.platform': 1, 'platforms.price': 1 });
productSchema.index({ lastScraped: 1 });
productSchema.index({ priority: 1 });

// Virtual for cheapest price
productSchema.virtual('cheapestPrice').get(function() {
  if (!this.platforms || this.platforms.length === 0) return null;
  
  const availablePlatforms = this.platforms.filter(p => p.availability);
  if (availablePlatforms.length === 0) return null;
  
  return availablePlatforms.reduce((cheapest, current) => 
    current.price < cheapest.price ? current : cheapest
  );
});

// Virtual for price range
productSchema.virtual('priceRange').get(function() {
  if (!this.platforms || this.platforms.length === 0) return null;
  
  const availablePlatforms = this.platforms.filter(p => p.availability);
  if (availablePlatforms.length === 0) return null;
  
  const prices = availablePlatforms.map(p => p.price);
  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
    difference: Math.max(...prices) - Math.min(...prices)
  };
});

// Virtual for savings amount
productSchema.virtual('maxSavings').get(function() {
  const range = this.priceRange;
  if (!range) return 0;
  return range.difference;
});

// Instance methods
productSchema.methods.getPlatformPrice = function(platformName) {
  return this.platforms.find(p => p.platform === platformName);
};

productSchema.methods.updatePlatformPrice = function(platformData) {
  const existingIndex = this.platforms.findIndex(
    p => p.platform === platformData.platform
  );
  
  if (existingIndex !== -1) {
    const oldPrice = this.platforms[existingIndex].price;
    const oldAvailability = this.platforms[existingIndex].availability;
    
    if (oldPrice === platformData.price && oldAvailability === platformData.availability) {
      // Save computing/writes if nothing fundamental changed regarding pricing / stock
      return Promise.resolve(this);
    }
    
    // Update existing platform data
    this.platforms[existingIndex] = { ...this.platforms[existingIndex], ...platformData };
    
    // Add to price history if price changed
    if (oldPrice !== platformData.price) {
      this.priceHistory.push({
        platform: platformData.platform,
        price: platformData.price,
        date: new Date()
      });
    }
  } else {
    // Add new platform data
    this.platforms.push(platformData);
    this.priceHistory.push({
      platform: platformData.platform,
      price: platformData.price,
      date: new Date()
    });
  }
  
  this.lastScraped = new Date();
  return this.save();
};

productSchema.methods.isAvailableOn = function(platformName) {
  const platform = this.getPlatformPrice(platformName);
  return platform ? platform.availability : false;
};

// Static methods
productSchema.statics.findByLocation = function(city, pincode) {
  return this.find({
    'location.city': city.toLowerCase(),
    'location.pincode': pincode
  });
};

productSchema.statics.searchProducts = function(query, city, options = {}) {
  const {
    category,
    brand,
    sortBy = 'relevance',
    limit = 20,
    skip = 0
  } = options;
  
  const searchQuery = {
    'location.city': city.toLowerCase(),
    $or: [
      { normalizedSearchKey: { $regex: query.toLowerCase(), $options: 'i' } },
      { name: { $regex: query, $options: 'i' } },
      { 'platforms.originalName': { $regex: query, $options: 'i' } }
    ]
  };
  
  if (category) {
    searchQuery.category = category.toLowerCase();
  }
  
  if (brand) {
    searchQuery.brand = brand.toLowerCase();
  }
  
  let sortQuery = {};
  switch (sortBy) {
    case 'price_low':
      sortQuery = { 'platforms.price': 1 };
      break;
    case 'price_high':
      sortQuery = { 'platforms.price': -1 };
      break;
    case 'newest':
      sortQuery = { createdAt: -1 };
      break;
    default:
      sortQuery = { score: { $meta: 'textScore' } };
  }
  
  return this.find(searchQuery)
    .sort(sortQuery)
    .limit(limit)
    .skip(skip)
    .populate('platforms');
};

productSchema.statics.getPopularProducts = function(city, limit = 10) {
  return this.find({
    'location.city': city.toLowerCase(),
    priority: 'high'
  })
  .sort({ lastScraped: -1 })
  .limit(limit);
};

module.exports = mongoose.model('Product', productSchema);
