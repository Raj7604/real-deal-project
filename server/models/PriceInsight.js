const mongoose = require('mongoose');

const priceInsightSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  location: {
    city: {
      type: String,
      required: true,
      index: true
    },
    pincode: {
      type: String,
      required: true
    }
  },
  insightType: {
    type: String,
    required: true,
    enum: ['price_trend', 'best_time_to_buy', 'platform_preference', 'price_volatility', 'savings_opportunity']
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    default: 0.8
  },
  data: {
    trend: {
      direction: String, // 'up', 'down', 'stable'
      percentage: Number,
      period: String, // 'week', 'month', 'quarter'
      dataPoints: [{
        date: Date,
        price: Number,
        platform: String
      }]
    },
    timing: {
      bestDay: String, // 'weekend', 'weekday', 'monday', etc.
      bestTime: String, // 'morning', 'afternoon', 'evening'
      averageSavings: Number
    },
    platform: {
      name: String,
      advantage: String, // 'price', 'delivery', 'availability', 'variety'
      percentage: Number,
      categories: [String]
    },
    volatility: {
      index: Number, // 0-1 scale
      range: {
        min: Number,
        max: Number,
        average: Number
      },
      frequency: String // 'high', 'medium', 'low'
    },
    savings: {
      potentialAmount: Number,
      potentialPercentage: Number,
      recommendedAction: String,
      targetPlatform: String
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  validUntil: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  metadata: {
    algorithm: String,
    version: String,
    dataPoints: Number,
    confidenceLevel: String
  }
}, {
  timestamps: true
});

// Indexes for performance
priceInsightSchema.index({ productId: 1, location: 1, insightType: 1 });
priceInsightSchema.index({ location: 1, insightType: 1, isActive: 1 });
priceInsightSchema.index({ validUntil: 1 }, { expireAfterSeconds: 0 });

// Static methods
priceInsightSchema.statics.getActiveInsights = function(productId, location, types = null) {
  const query = {
    productId,
    'location.city': location.city,
    'location.pincode': location.pincode,
    isActive: true,
    validUntil: { $gt: new Date() }
  };
  
  if (types && types.length > 0) {
    query.insightType = { $in: types };
  }
  
  return this.find(query).sort({ generatedAt: -1 });
};

priceInsightSchema.statics.getInsightsByType = function(location, insightType, limit = 10) {
  return this.find({
    'location.city': location.city,
    'location.pincode': location.pincode,
    insightType,
    isActive: true,
    validUntil: { $gt: new Date() }
  })
  .populate('productId', 'name brand category')
  .sort({ generatedAt: -1 })
  .limit(limit);
};

priceInsightSchema.statics.getPlatformIntelligence = function(location) {
  return this.aggregate([
    {
      $match: {
        'location.city': location.city,
        'location.pincode': location.pincode,
        insightType: 'platform_preference',
        isActive: true,
        validUntil: { $gt: new Date() }
      }
    },
    {
      $group: {
        _id: '$data.platform.name',
        insights: { $push: '$data' },
        avgConfidence: { $avg: '$confidence' }
      }
    },
    {
      $sort: { avgConfidence: -1 }
    }
  ]);
};

priceInsightSchema.statics.cleanupExpiredInsights = function() {
  return this.deleteMany({
    validUntil: { $lt: new Date() }
  });
};

module.exports = mongoose.model('PriceInsight', priceInsightSchema);
