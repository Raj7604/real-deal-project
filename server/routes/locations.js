const express = require('express');
const router = express.Router();
const Location = require('../models/Location');
const { validateLocation } = require('../middleware/validation');

// Get all active cities
router.get('/cities', async (req, res) => {
  try {
    const cities = await Location.getActiveCities();
    
    res.json({
      success: true,
      data: cities,
      count: cities.length
    });
  } catch (error) {
    console.error('Error fetching cities:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cities'
    });
  }
});

// Get location by pincode
router.get('/pincode/:pincode', async (req, res) => {
  try {
    const { pincode } = req.params;
    
    const location = await Location.findByPincode(pincode);
    
    if (!location) {
      return res.status(404).json({
        success: false,
        error: 'Location not found for this pincode'
      });
    }
    
    res.json({
      success: true,
      data: location
    });
  } catch (error) {
    console.error('Error fetching location by pincode:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch location'
    });
  }
});

// Check platform support in city
router.get('/platform-support/:city/:platform', async (req, res) => {
  try {
    const { city, platform } = req.params;
    
    const isSupported = await Location.isPlatformSupported(city, platform);
    
    res.json({
      success: true,
      data: {
        city,
        platform,
        supported: !!isSupported
      }
    });
  } catch (error) {
    console.error('Error checking platform support:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check platform support'
    });
  }
});

// Add new location (admin only)
router.post('/', async (req, res) => {
  try {
    const locationData = req.body;
    
    const existingLocation = await Location.findOne({
      city: locationData.city.toLowerCase()
    });
    
    if (existingLocation) {
      return res.status(400).json({
        success: false,
        error: 'Location already exists'
      });
    }
    
    const location = new Location(locationData);
    await location.save();
    
    res.status(201).json({
      success: true,
      data: location
    });
  } catch (error) {
    console.error('Error creating location:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create location'
    });
  }
});

module.exports = router;
