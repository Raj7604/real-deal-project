const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  city: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  state: {
    type: String,
    required: true,
    trim: true
  },
  pincodes: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  supportedPlatforms: [{
    type: String,
    enum: ['blinkit', 'zepto', 'instamart', 'bigbasket']
  }],
  defaultPincode: {
    type: String,
    required: true
  },
  timezone: {
    type: String,
    default: 'Asia/Kolkata'
  },
  metadata: {
    population: Number,
    area: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  }
}, {
  timestamps: true
});

locationSchema.index({ city: 1 });
locationSchema.index({ state: 1 });
locationSchema.index({ pincodes: 1 });

// Static method to get all active cities
locationSchema.statics.getActiveCities = function() {
  return this.find({ isActive: true }).sort({ city: 1 });
};

// Static method to find city by pincode
locationSchema.statics.findByPincode = function(pincode) {
  return this.findOne({ 
    pincodes: pincode,
    isActive: true 
  });
};

// Static method to check if platform is supported in city
locationSchema.statics.isPlatformSupported = function(city, platform) {
  return this.findOne({ 
    city: city.toLowerCase(),
    supportedPlatforms: platform,
    isActive: true 
  });
};

module.exports = mongoose.model('Location', locationSchema);
