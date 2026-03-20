const mongoose = require('mongoose');

const userBehaviorSchema = new mongoose.Schema({
  sessionId: {
    type: String,
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
  events: [{
    type: {
      type: String,
      required: true,
      enum: ['search', 'product_view', 'comparison', 'platform_click', 'filter_change', 'sort_change']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    data: {
      query: String,
      productId: mongoose.Schema.Types.ObjectId,
      productIds: [mongoose.Schema.Types.ObjectId],
      platform: String,
      filters: mongoose.Schema.Types.Mixed,
      sortBy: String,
      resultCount: Number,
      duration: Number // time spent on page in milliseconds
    }
  }],
  preferences: {
    favoriteCategories: [String],
    favoriteBrands: [String],
    preferredPlatforms: [String],
    priceSensitivity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    deliveryPriority: {
      type: String,
      enum: ['price', 'speed', 'balanced'],
      default: 'balanced'
    }
  },
  demographics: {
    approximateLocation: String,
    deviceType: String,
    browser: String,
    timeOfDay: String
  }
}, {
  timestamps: true
});

// Indexes for performance
userBehaviorSchema.index({ sessionId: 1, 'events.timestamp': -1 });
userBehaviorSchema.index({ 'location.city': 1, 'events.type': 1 });
userBehaviorSchema.index({ 'events.type': 1, 'events.timestamp': -1 });

// Static methods
userBehaviorSchema.statics.trackEvent = function(sessionId, location, eventType, data) {
  return this.findOneAndUpdate(
    { sessionId },
    {
      $push: {
        events: {
          type: eventType,
          timestamp: new Date(),
          data
        }
      },
      $setOnInsert: {
        location,
        sessionId,
        'events.timestamp': new Date()
      }
    },
    { upsert: true, new: true }
  );
};

userBehaviorSchema.statics.updatePreferences = function(sessionId, preferences) {
  return this.findOneAndUpdate(
    { sessionId },
    { $set: { preferences } },
    { new: true }
  );
};

userBehaviorSchema.statics.getSearchHistory = function(sessionId, limit = 10) {
  return this.findOne(
    { sessionId },
    {
      'events': {
        $filter: { type: 'search' },
        $sort: { timestamp: -1 },
        $slice: limit
      }
    }
  );
};

userBehaviorSchema.statics.getPopularProducts = function(location, limit = 10) {
  return this.aggregate([
    {
      $match: {
        'location.city': location.city,
        'location.pincode': location.pincode,
        'events.type': { $in: ['search', 'product_view', 'comparison'] }
      }
    },
    { $unwind: '$events' },
    {
      $match: {
        'events.type': { $in: ['search', 'product_view', 'comparison'] }
      }
    },
    {
      $group: {
        _id: {
          $cond: [
            { $ne: ['$events.data.productId', null] },
            '$events.data.productId',
            '$events.data.query'
          ]
        },
        frequency: { $sum: 1 },
        lastSeen: { $max: '$events.timestamp' },
        eventTypes: { $addToSet: '$events.type' }
      }
    },
    {
      $sort: { frequency: -1, lastSeen: -1 }
    },
    { $limit: limit }
  ]);
};

userBehaviorSchema.statics.getPlatformPreferences = function(location) {
  return this.aggregate([
    {
      $match: {
        'location.city': location.city,
        'location.pincode': location.pincode,
        'events.type': 'platform_click'
      }
    },
    { $unwind: '$events' },
    {
      $match: {
        'events.type': 'platform_click'
      }
    },
    {
      $group: {
        _id: '$events.data.platform',
        clicks: { $sum: 1 },
        conversions: {
          $sum: {
            $cond: [{ $eq: ['$events.data.converted', true] }, 1, 0]
          }
        }
      }
    },
    {
      $sort: { clicks: -1 }
    }
  ]);
};

userBehaviorSchema.statics.cleanupOldSessions = function(daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  return this.deleteMany({
    createdAt: { $lt: cutoffDate }
  });
};

// Virtual for getting most recent search
userBehaviorSchema.virtual('mostRecentSearch').get(function() {
  const searchEvents = this.events.filter(e => e.type === 'search');
  if (searchEvents.length === 0) return null;
  
  return searchEvents.reduce((mostRecent, event) => 
    event.timestamp > mostRecent.timestamp ? event : mostRecent
  );
});

module.exports = mongoose.model('UserBehavior', userBehaviorSchema);
