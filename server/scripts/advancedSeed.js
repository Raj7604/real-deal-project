require('dotenv').config();
const database = require('../utils/database');
const mongoose = require('mongoose');
const Location = require('../models/Location');
const Product = require('../models/Product');

const CITIES = ['bangalore', 'delhi', 'mumbai', 'chennai', 'kolkata'];

const sampleLocations = [
  {
    city: 'bangalore', state: 'Karnataka', pincodes: ['560001'], defaultPincode: '560001',
    supportedPlatforms: ['blinkit', 'zepto', 'instamart', 'bigbasket']
  },
  {
    city: 'delhi', state: 'Delhi', pincodes: ['110001'], defaultPincode: '110001',
    supportedPlatforms: ['blinkit', 'zepto', 'instamart', 'bigbasket']
  },
  {
    city: 'mumbai', state: 'Maharashtra', pincodes: ['400001'], defaultPincode: '400001',
    supportedPlatforms: ['blinkit', 'zepto', 'instamart', 'bigbasket']
  },
  {
    city: 'chennai', state: 'Tamil Nadu', pincodes: ['600001'], defaultPincode: '600001',
    supportedPlatforms: ['blinkit', 'zepto', 'instamart', 'bigbasket']
  },
  {
    city: 'kolkata', state: 'West Bengal', pincodes: ['700001'], defaultPincode: '700001',
    supportedPlatforms: ['blinkit', 'zepto', 'instamart', 'bigbasket']
  }
];

const BRANDS = ['Amul', 'Britannia', 'Nestle', 'Parle', 'Haldirams', 'Aashirvaad', 'Tata', 'Fortune', 'Local', 'FarmFresh', 'Gillette', 'Dove', 'Pears', 'Lays', 'Kurkure', 'Bingo', 'Kelloggs', 'Saffola', 'Dabur', 'Himalaya'];

const CATEGORY_ITEMS = {
  vegetables: [
    { name: 'Onion', basePrice: 30, unit: 'kg', q: 1, sq: 1000, su: 'g' },
    { name: 'Potato', basePrice: 20, unit: 'kg', q: 1, sq: 1000, su: 'g' },
    { name: 'Tomato', basePrice: 25, unit: 'g', q: 500, sq: 500, su: 'g' },
    { name: 'Carrot', basePrice: 40, unit: 'g', q: 500, sq: 500, su: 'g' },
    { name: 'Capsicum', basePrice: 60, unit: 'g', q: 250, sq: 250, su: 'g' },
    { name: 'Cauliflower', basePrice: 35, unit: 'pcs', q: 1, sq: 500, su: 'g' },
    { name: 'Cabbage', basePrice: 30, unit: 'pcs', q: 1, sq: 500, su: 'g' },
    { name: 'Green Chilli', basePrice: 15, unit: 'g', q: 100, sq: 100, su: 'g' },
    { name: 'Ginger', basePrice: 25, unit: 'g', q: 100, sq: 100, su: 'g' },
    { name: 'Garlic', basePrice: 30, unit: 'g', q: 100, sq: 100, su: 'g' }
  ],
  fruits: [
    { name: 'Apple Washington', basePrice: 150, unit: 'kg', q: 1, sq: 1000, su: 'g' },
    { name: 'Banana Robusta', basePrice: 50, unit: 'pcs', q: 6, sq: 600, su: 'g' },
    { name: 'Orange Nagpur', basePrice: 80, unit: 'kg', q: 1, sq: 1000, su: 'g' },
    { name: 'Papaya', basePrice: 60, unit: 'pcs', q: 1, sq: 1000, su: 'g' },
    { name: 'Pomegranate', basePrice: 120, unit: 'kg', q: 1, sq: 1000, su: 'g' },
    { name: 'Mango Alphonso', basePrice: 400, unit: 'pcs', q: 6, sq: 1500, su: 'g' }
  ],
  dairy: [
    { name: 'Toned Milk', basePrice: 27, unit: 'ml', q: 500, sq: 500, su: 'ml' },
    { name: 'Full Cream Milk', basePrice: 33, unit: 'ml', q: 500, sq: 500, su: 'ml' },
    { name: 'Curd / Dahi', basePrice: 40, unit: 'g', q: 400, sq: 400, su: 'g' },
    { name: 'Paneer', basePrice: 85, unit: 'g', q: 200, sq: 200, su: 'g' },
    { name: 'Cheese Slices', basePrice: 130, unit: 'g', q: 200, sq: 200, su: 'g' },
    { name: 'Salted Butter', basePrice: 55, unit: 'g', q: 100, sq: 100, su: 'g' }
  ],
  grains: [
    { name: 'Basmati Rice', basePrice: 85, unit: 'kg', q: 1, sq: 1000, su: 'g' },
    { name: 'Sona Masoori Rice', basePrice: 60, unit: 'kg', q: 1, sq: 1000, su: 'g' },
    { name: 'Chakki Atta', basePrice: 45, unit: 'kg', q: 1, sq: 1000, su: 'g' },
    { name: 'Toor Dal', basePrice: 150, unit: 'kg', q: 1, sq: 1000, su: 'g' },
    { name: 'Moong Dal', basePrice: 120, unit: 'g', q: 500, sq: 500, su: 'g' },
    { name: 'Chana Dal', basePrice: 90, unit: 'g', q: 500, sq: 500, su: 'g' },
    { name: 'Urad Dal', basePrice: 140, unit: 'g', q: 500, sq: 500, su: 'g' }
  ],
  snacks: [
    { name: 'Potato Chips', basePrice: 20, unit: 'g', q: 50, sq: 50, su: 'g' },
    { name: 'Nachos', basePrice: 40, unit: 'g', q: 150, sq: 150, su: 'g' },
    { name: 'Bhujia Sev', basePrice: 55, unit: 'g', q: 200, sq: 200, su: 'g' },
    { name: 'Moong Dal Snack', basePrice: 50, unit: 'g', q: 200, sq: 200, su: 'g' },
    { name: 'Chocolate Chip Cookies', basePrice: 60, unit: 'g', q: 150, sq: 150, su: 'g' },
    { name: 'Digestive Biscuits', basePrice: 45, unit: 'g', q: 250, sq: 250, su: 'g' },
    { name: 'Marie Biscuits', basePrice: 30, unit: 'g', q: 250, sq: 250, su: 'g' }
  ],
  beverages: [
    { name: 'Cola Soft Drink', basePrice: 40, unit: 'ml', q: 750, sq: 750, su: 'ml' },
    { name: 'Orange Juice', basePrice: 110, unit: 'l', q: 1, sq: 1000, su: 'ml' },
    { name: 'Mixed Fruit Juice', basePrice: 105, unit: 'l', q: 1, sq: 1000, su: 'ml' },
    { name: 'Mineral Water', basePrice: 20, unit: 'l', q: 1, sq: 1000, su: 'ml' },
    { name: 'Green Tea Bags', basePrice: 150, unit: 'pcs', q: 25, sq: 50, su: 'g' },
    { name: 'Instant Coffee', basePrice: 290, unit: 'g', q: 50, sq: 50, su: 'g' }
  ],
  personal_care: [
    { name: 'Bathing Soap', basePrice: 40, unit: 'g', q: 100, sq: 100, su: 'g' },
    { name: 'Liquid Handwash', basePrice: 90, unit: 'ml', q: 200, sq: 200, su: 'ml' },
    { name: 'Toothpaste', basePrice: 65, unit: 'g', q: 100, sq: 100, su: 'g' },
    { name: 'Shampoo', basePrice: 150, unit: 'ml', q: 180, sq: 180, su: 'ml' },
    { name: 'Deodorant Body Spray', basePrice: 200, unit: 'ml', q: 150, sq: 150, su: 'ml' },
    { name: 'Face Wash', basePrice: 120, unit: 'ml', q: 100, sq: 100, su: 'ml' }
  ]
};

function getRandomBrand() {
  return BRANDS[Math.floor(Math.random() * BRANDS.length)];
}

function getRandomDelta(basePrice, maxPercent) {
  const delta = basePrice * (maxPercent / 100);
  return (Math.random() * delta * 2) - delta;
}

function generatePlatforms(productName, basePrice) {
  const platforms = ['blinkit', 'zepto', 'instamart', 'bigbasket'];
  const pData = [];
  
  platforms.forEach(p => {
    // 90% chance platform carries it
    const available = Math.random() < 0.9;
    
    // Price variation +/- 15%
    let price = Math.round(basePrice + getRandomDelta(basePrice, 15));
    if (price < 1) price = 1;
    
    pData.push({
      platform: p,
      price: price,
      originalName: `${productName} - ${p}`,
      imageUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(productName)}&background=random`,
      deliveryTime: Math.floor(Math.random() * 20 + 10) + ' mins',
      availability: available,
      lastUpdated: new Date()
    });
  });
  
  // Ensure at least one platform is active
  if (!pData.some(p => p.availability)) {
    pData[0].availability = true;
  }
  
  return pData;
}

async function runAdvancedSeed() {
  try {
    console.log('🚀 Starting Advanced Large-Scale Database Seeding...');
    await database.connect();
    
    console.log('🗑️ Wiping existing tables...');
    await Location.deleteMany({});
    await Product.deleteMany({});
    
    console.log('📍 Seeding core locations...');
    for (const loc of sampleLocations) {
      await (new Location(loc)).save();
    }
    
    let globalProductDocs = [];
    
    console.log('🧬 Generating procedural dataset for 5 cities...');
    const cityMultipliers = {
      'bangalore': 1.0,
      'delhi': 1.05,
      'mumbai': 1.12,
      'chennai': 0.95,
      'kolkata': 0.92
    };

    for (const city of CITIES) {
      let count = 0;
      
      for (const [category, items] of Object.entries(CATEGORY_ITEMS)) {
        // Expand each item into multiple variants
        for (const baseItem of items) {
          // Generate 3 variants per item
          for (let v = 1; v <= 3; v++) {
            const variantBrand = getRandomBrand();
            const fullName = `${variantBrand} ${baseItem.name} ${v > 1 ? `Premium v${v}` : ''}`.trim();
            const variantBasePrice = baseItem.basePrice * (v === 1 ? 1 : 1.4); // premium variations
            
            const cityPriceBaseline = variantBasePrice * cityMultipliers[city];
            const platforms = generatePlatforms(fullName, cityPriceBaseline);
            
            const product = new Product({
              name: fullName,
              normalizedSearchKey: fullName.toLowerCase(),
              category: category,
              brand: variantBrand.toLowerCase(),
              quantity: baseItem.q,
              unit: baseItem.unit,
              standardizedQuantity: baseItem.sq,
              standardizedUnit: baseItem.su,
              image: `https://ui-avatars.com/api/?name=${encodeURIComponent(baseItem.name)}&background=random&color=fff`,
              platforms: platforms,
              location: {
                city: city,
                pincode: sampleLocations.find(l => l.city === city).defaultPincode
              },
              priority: (Math.random() < 0.2) ? 'high' : 'medium', // 20% high priority
              tags: [category, baseItem.name.toLowerCase()]
            });
            
            globalProductDocs.push(product);
            count++;
          }
        }
      }
      console.log(`✅ Generated ${count} products for ${city}`);
    }
    
    console.log(`💾 Inserting ${globalProductDocs.length} bulk records into MongoDB...`);
    // Insert in batches of 500
    const BATCH_SIZE = 500;
    for (let i = 0; i < globalProductDocs.length; i += BATCH_SIZE) {
      const batch = globalProductDocs.slice(i, i + BATCH_SIZE);
      await Product.insertMany(batch);
      console.log(`Inserted batch ${i/BATCH_SIZE + 1}...`);
    }
    
    console.log('✅ Advanced Seeding fully completed!');
  } catch (err) {
    console.error('❌ Advanced Seeding failed:', err);
  } finally {
    await database.disconnect();
    process.exit(0);
  }
}

runAdvancedSeed();
