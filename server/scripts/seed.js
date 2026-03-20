require('dotenv').config();
const database = require('../utils/database');
const mongoose = require('mongoose');
const Location = require('../models/Location');
const Product = require('../models/Product');

// Sample data for seeding
const sampleLocations = [
  {
    city: 'bangalore',
    state: 'Karnataka',
    pincodes: ['560001', '560002', '560003', '560004', '560005', '560006', '560007', '560008', '560009', '560010'],
    defaultPincode: '560001',
    supportedPlatforms: ['blinkit', 'zepto', 'instamart', 'bigbasket'],
    metadata: {
      population: 12000000,
      area: '741 sq km',
      coordinates: { latitude: 12.9716, longitude: 77.5946 }
    }
  },
  {
    city: 'delhi',
    state: 'Delhi',
    pincodes: ['110001', '110002', '110003', '110004', '110005', '110006', '110007', '110008', '110009', '110010'],
    defaultPincode: '110001',
    supportedPlatforms: ['blinkit', 'zepto', 'instamart', 'bigbasket'],
    metadata: {
      population: 32000000,
      area: '1484 sq km',
      coordinates: { latitude: 28.7041, longitude: 77.1025 }
    }
  },
  {
    city: 'mumbai',
    state: 'Maharashtra',
    pincodes: ['400001', '400002', '400003', '400004', '400005', '400006', '400007', '400008', '400009', '400010'],
    defaultPincode: '400001',
    supportedPlatforms: ['blinkit', 'zepto', 'instamart', 'bigbasket'],
    metadata: {
      population: 20000000,
      area: '603 sq km',
      coordinates: { latitude: 19.0760, longitude: 72.8777 }
    }
  },
  {
    city: 'chennai',
    state: 'Tamil Nadu',
    pincodes: ['600001', '600002', '600003', '600004', '600005', '600006', '600007', '600008', '600009', '600010'],
    defaultPincode: '600001',
    supportedPlatforms: ['blinkit', 'zepto', 'instamart', 'bigbasket'],
    metadata: {
      population: 8700000,
      area: '426 sq km',
      coordinates: { latitude: 13.0827, longitude: 80.2707 }
    }
  },
  {
    city: 'kolkata',
    state: 'West Bengal',
    pincodes: ['700001', '700002', '700003', '700004', '700005', '700006', '700007', '700008', '700009', '700010'],
    defaultPincode: '700001',
    supportedPlatforms: ['blinkit', 'zepto', 'instamart', 'bigbasket'],
    metadata: {
      population: 15000000,
      area: '185 sq km',
      coordinates: { latitude: 22.5726, longitude: 88.3639 }
    }
  }
];

const sampleProducts = [
  {
    name: 'Amul Taaza Toned Milk',
    normalizedSearchKey: 'amul taaza toned milk',
    category: 'dairy',
    brand: 'amul',
    quantity: 1,
    unit: 'l',
    standardizedQuantity: 1000,
    standardizedUnit: 'ml',
    image: 'https://example.com/amul-milk.jpg',
    priority: 'high',
    platforms: [
      {
        platform: 'blinkit',
        price: 58,
        originalName: 'Amul Taaza Toned Milk 1L',
        imageUrl: 'https://example.com/amul-milk-blinkit.jpg',
        deliveryTime: '15-20 mins',
        availability: true
      },
      {
        platform: 'zepto',
        price: 57,
        originalName: 'Amul Taaza Toned Milk 1 Litre',
        imageUrl: 'https://example.com/amul-milk-zepto.jpg',
        deliveryTime: '10-15 mins',
        availability: true
      },
      {
        platform: 'instamart',
        price: 59,
        originalName: 'Amul Taaza Milk Toned 1L',
        imageUrl: 'https://example.com/amul-milk-instamart.jpg',
        deliveryTime: '20-25 mins',
        availability: true
      },
      {
        platform: 'bigbasket',
        price: 56,
        originalName: 'Amul Taaza Toned Milk - 1 L',
        imageUrl: 'https://example.com/amul-milk-bigbasket.jpg',
        deliveryTime: '2-3 hours',
        availability: true
      }
    ],
    location: {
      city: 'bangalore',
      pincode: '560001'
    }
  },
  {
    name: 'Brown Bread',
    normalizedSearchKey: 'brown bread',
    category: 'bakery',
    brand: 'britannia',
    quantity: 400,
    unit: 'g',
    standardizedQuantity: 400,
    standardizedUnit: 'g',
    image: 'https://example.com/brown-bread.jpg',
    priority: 'high',
    platforms: [
      {
        platform: 'blinkit',
        price: 35,
        originalName: 'Britannia Brown Bread 400g',
        imageUrl: 'https://example.com/bread-blinkit.jpg',
        deliveryTime: '15-20 mins',
        availability: true
      },
      {
        platform: 'zepto',
        price: 34,
        originalName: 'Britannia Brown Bread 400 grams',
        imageUrl: 'https://example.com/bread-zepto.jpg',
        deliveryTime: '10-15 mins',
        availability: true
      },
      {
        platform: 'instamart',
        price: 36,
        originalName: 'Britannia Brown Bread - 400g',
        imageUrl: 'https://example.com/bread-instamart.jpg',
        deliveryTime: '20-25 mins',
        availability: true
      },
      {
        platform: 'bigbasket',
        price: 33,
        originalName: 'Britannia Brown Bread 400 g',
        imageUrl: 'https://example.com/bread-bigbasket.jpg',
        deliveryTime: '2-3 hours',
        availability: true
      }
    ],
    location: {
      city: 'bangalore',
      pincode: '560001'
    }
  },
  {
    name: 'Basmati Rice',
    normalizedSearchKey: 'basmati rice',
    category: 'grains',
    brand: 'india gate',
    quantity: 5,
    unit: 'kg',
    standardizedQuantity: 5000,
    standardizedUnit: 'g',
    image: 'https://example.com/basmati-rice.jpg',
    priority: 'medium',
    platforms: [
      {
        platform: 'blinkit',
        price: 425,
        originalName: 'India Gate Basmati Rice 5kg',
        imageUrl: 'https://example.com/rice-blinkit.jpg',
        deliveryTime: '15-20 mins',
        availability: true
      },
      {
        platform: 'zepto',
        price: 420,
        originalName: 'India Gate Basmati Rice Classic 5 kg',
        imageUrl: 'https://example.com/rice-zepto.jpg',
        deliveryTime: '10-15 mins',
        availability: true
      },
      {
        platform: 'instamart',
        price: 430,
        originalName: 'India Gate Basmati Rice 5 kilograms',
        imageUrl: 'https://example.com/rice-instamart.jpg',
        deliveryTime: '20-25 mins',
        availability: true
      },
      {
        platform: 'bigbasket',
        price: 415,
        originalName: 'India Gate Basmati Rice Classic - 5 kg',
        imageUrl: 'https://example.com/rice-bigbasket.jpg',
        deliveryTime: '2-3 hours',
        availability: true
      }
    ],
    location: {
      city: 'bangalore',
      pincode: '560001'
    }
  },
  {
    name: 'Refined Sunflower Oil',
    normalizedSearchKey: 'refined sunflower oil',
    category: 'oil',
    brand: 'fortune',
    quantity: 1,
    unit: 'l',
    standardizedQuantity: 1000,
    standardizedUnit: 'ml',
    image: 'https://example.com/sunflower-oil.jpg',
    priority: 'medium',
    platforms: [
      {
        platform: 'blinkit',
        price: 135,
        originalName: 'Fortune Refined Sunflower Oil 1L',
        imageUrl: 'https://example.com/oil-blinkit.jpg',
        deliveryTime: '15-20 mins',
        availability: true
      },
      {
        platform: 'zepto',
        price: 132,
        originalName: 'Fortune Refined Sunflower Oil 1 Litre',
        imageUrl: 'https://example.com/oil-zepto.jpg',
        deliveryTime: '10-15 mins',
        availability: true
      },
      {
        platform: 'instamart',
        price: 138,
        originalName: 'Fortune Refined Sunflower Oil - 1L',
        imageUrl: 'https://example.com/oil-instamart.jpg',
        deliveryTime: '20-25 mins',
        availability: true
      },
      {
        platform: 'bigbasket',
        price: 129,
        originalName: 'Fortune Refined Sunflower Oil 1 l',
        imageUrl: 'https://example.com/oil-bigbasket.jpg',
        deliveryTime: '2-3 hours',
        availability: true
      }
    ],
    location: {
      city: 'bangalore',
      pincode: '560001'
    }
  },
  {
    name: 'Fresh Tomatoes',
    normalizedSearchKey: 'fresh tomatoes',
    category: 'vegetables',
    brand: 'local',
    quantity: 500,
    unit: 'g',
    standardizedQuantity: 500,
    standardizedUnit: 'g',
    image: 'https://example.com/tomatoes.jpg',
    priority: 'high',
    platforms: [
      {
        platform: 'blinkit',
        price: 25,
        originalName: 'Fresh Tomatoes 500g',
        imageUrl: 'https://example.com/tomatoes-blinkit.jpg',
        deliveryTime: '15-20 mins',
        availability: true
      },
      {
        platform: 'zepto',
        price: 24,
        originalName: 'Fresh Red Tomatoes 500 grams',
        imageUrl: 'https://example.com/tomatoes-zepto.jpg',
        deliveryTime: '10-15 mins',
        availability: true
      },
      {
        platform: 'instamart',
        price: 26,
        originalName: 'Fresh Tomatoes - 500g',
        imageUrl: 'https://example.com/tomatoes-instamart.jpg',
        deliveryTime: '20-25 mins',
        availability: true
      },
      {
        platform: 'bigbasket',
        price: 23,
        originalName: 'Fresh Tomatoes 500 g',
        imageUrl: 'https://example.com/tomatoes-bigbasket.jpg',
        deliveryTime: '2-3 hours',
        availability: true
      }
    ],
    location: {
      city: 'bangalore',
      pincode: '560001'
    }
  }
];

async function seedDatabase(disconnectWhenDone = true) {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to database if not actively connected
    if (mongoose.connection.readyState !== 1) {
      await database.connect();
    }
    
    // Clear existing data (only in development)
    if (process.env.NODE_ENV !== 'production') {
      console.log('🗑️ Clearing existing data...');
      await Location.deleteMany({});
      await Product.deleteMany({});
    }
    
    // Seed locations
    console.log('📍 Seeding locations...');
    for (const locationData of sampleLocations) {
      const location = new Location(locationData);
      await location.save();
      console.log(`✅ Added location: ${locationData.city}`);
    }
    
    // Seed products for each location
    console.log('🛒 Seeding products...');
    const cities = ['bangalore', 'delhi', 'mumbai', 'chennai', 'kolkata'];
    
    for (const city of cities) {
      for (const productData of sampleProducts) {
        // Create a copy of the product for each city
        const cityProduct = {
          ...productData,
          location: {
            city,
            pincode: sampleLocations.find(l => l.city === city)?.defaultPincode || '000001'
          }
        };
        
        // Add some price variation based on city
        const priceMultiplier = {
          'bangalore': 1.0,
          'delhi': 1.05,
          'mumbai': 1.1,
          'chennai': 0.95,
          'kolkata': 0.9
        }[city] || 1.0;
        
        cityProduct.platforms = cityProduct.platforms.map(platform => ({
          ...platform,
          price: Math.round(platform.price * priceMultiplier)
        }));
        
        const product = new Product(cityProduct);
        await product.save();
      }
      console.log(`✅ Added products for ${city}`);
    }
    
    console.log('🎉 Database seeding completed successfully!');
    console.log(`📍 Locations: ${sampleLocations.length}`);
    console.log(`🛒 Products per city: ${sampleProducts.length}`);
    console.log(`📊 Total products: ${sampleProducts.length * cities.length}`);
    
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  } finally {
    if (disconnectWhenDone) {
      await database.disconnect();
    }
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase(true)
    .then(() => {
      console.log('✅ Seeding completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedDatabase, sampleLocations, sampleProducts };
