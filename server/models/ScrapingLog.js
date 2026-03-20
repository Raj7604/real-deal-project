const mongoose = require('mongoose');

const scrapingLogSchema = new mongoose.Schema({
  platform: {
    type: String,
    required: true,
    enum: ['blinkit', 'zepto', 'instamart', 'bigbasket']
  },
  location: {
    city: {
      type: String,
      required: true
    },
    pincode: {
      type: String,
      required: true
    }
  },
  status: {
    type: String,
    required: true,
    enum: ['success', 'error', 'partial', 'running']
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number // in milliseconds
  },
  productsScraped: {
    type: Number,
    default: 0
  },
  productsUpdated: {
    type: Number,
    default: 0
  },
  productsAdded: {
    type: Number,
    default: 0
  },
  errors: [{
    type: String,
    message: String,
    timestamp: Date
  }],
  metadata: {
    userAgent: String,
    proxyUsed: String,
    categoriesScraped: [String],
    totalProductsFound: Number,
    duplicateProductsFound: Number
  }
}, {
  timestamps: true
});

scrapingLogSchema.index({ platform: 1, startTime: -1 });
scrapingLogSchema.index({ 'location.city': 1, startTime: -1 });
scrapingLogSchema.index({ status: 1, startTime: -1 });

module.exports = mongoose.model('ScrapingLog', scrapingLogSchema);
