const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const axios = require('axios');
const Product = require('../models/Product');
const ScrapingLog = require('../models/ScrapingLog');
const { normalizeProductName, extractQuantity, extractBrand, extractCategory, matchProducts, createUnifiedProduct } = require('./productNormalization');

// Platform configurations
const PLATFORM_CONFIGS = {
  blinkit: {
    baseUrl: 'https://blinkit.com',
    searchUrl: 'https://blinkit.com/search?q=',
    selectors: {
      productCard: '.product-card',
      productName: '.product-name',
      productPrice: '.product-price',
      productImage: '.product-image',
      productLink: '.product-link',
      deliveryTime: '.delivery-time'
    },
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
  },
  zepto: {
    baseUrl: 'https://www.zepto.in',
    searchUrl: 'https://www.zepto.in/search?q=',
    selectors: {
      productCard: '.product-item',
      productName: '.product-title',
      productPrice: '.price',
      productImage: '.product-image',
      productLink: '.product-link',
      deliveryTime: '.delivery-info'
    }
  },
  instamart: {
    baseUrl: 'https://www.instamart.com',
    searchUrl: 'https://www.instamart.com/search?q=',
    selectors: {
      productCard: '.product-card',
      productName: '.product-name',
      productPrice: '.price-tag',
      productImage: '.product-img',
      productLink: '.product-url',
      deliveryTime: '.delivery-slot'
    }
  },
  bigbasket: {
    baseUrl: 'https://www.bigbasket.com',
    searchUrl: 'https://www.bigbasket.com/cl/search?q=',
    selectors: {
      productCard: '.product-item',
      productName: '.product-name',
      productPrice: '.price',
      productImage: '.product-image',
      productLink: '.product-link',
      deliveryTime: '.delivery-time'
    }
  }
};

// Common search categories for comprehensive data collection
const SEARCH_CATEGORIES = [
  'milk', 'bread', 'eggs', 'rice', 'flour', 'oil', 'sugar', 'salt',
  'vegetables', 'fruits', 'dairy', 'snacks', 'beverages', 'personal care',
  'cleaning', 'pulses', 'spices', 'tea', 'coffee', 'biscuits', 'chips'
];

// Scrape single platform
async function scrapePlatform(platform, city, pincode, categories = null, logId = null) {
  const config = PLATFORM_CONFIGS[platform];
  if (!config) {
    throw new Error(`Invalid platform: ${platform}`);
  }

  const startTime = Date.now();
  let browser = null;
  let page = null;
  let productsScraped = 0;
  let productsUpdated = 0;
  let productsAdded = 0;
  const errors = [];

  try {
    // Update log status to running
    if (logId) {
      await ScrapingLog.findByIdAndUpdate(logId, { status: 'running' });
    }

    // Launch browser
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });

    page = await browser.newPage();
    
    // Set user agent and viewport
    await page.setUserAgent(config.headers?.['User-Agent'] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    await page.setViewport({ width: 1366, height: 768 });

    // Set location (simulate user location)
    await page.evaluateOnNewDocument((city, pincode) => {
      // Try to set location via localStorage or cookies
      localStorage.setItem('userCity', city);
      localStorage.setItem('userPincode', pincode);
    }, city, pincode);

    const searchTerms = categories || SEARCH_CATEGORIES;
    const allProducts = [];

    for (const searchTerm of searchTerms) {
      try {
        const searchUrl = `${config.searchUrl}${encodeURIComponent(searchTerm)}`;
        
        console.log(`Scraping ${platform} for "${searchTerm}" in ${city}...`);
        
        await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
        
        // Wait for content to load
        await page.waitForTimeout(2000);
        
        // Extract product data
        const products = await page.evaluate((config) => {
          const products = [];
          const productCards = document.querySelectorAll(config.selectors.productCard);
          
          productCards.forEach(card => {
            try {
              const nameElement = card.querySelector(config.selectors.productName);
              const priceElement = card.querySelector(config.selectors.productPrice);
              const imageElement = card.querySelector(config.selectors.productImage);
              const linkElement = card.querySelector(config.selectors.productLink);
              const deliveryElement = card.querySelector(config.selectors.deliveryTime);
              
              if (nameElement && priceElement) {
                const name = nameElement.textContent?.trim();
                const priceText = priceElement.textContent?.trim();
                const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
                
                if (name && !isNaN(price) && price > 0) {
                  products.push({
                    name,
                    price,
                    image: imageElement?.src || imageElement?.getAttribute('data-src') || null,
                    link: linkElement?.href || null,
                    deliveryTime: deliveryElement?.textContent?.trim() || null
                  });
                }
              }
            } catch (error) {
              console.error('Error extracting product:', error);
            }
          });
          
          return products;
        }, config);

        allProducts.push(...products);
        productsScraped += products.length;
        
        // Add delay to avoid being blocked
        await page.waitForTimeout(Math.random() * 2000 + 1000);
        
      } catch (error) {
        console.error(`Error scraping ${platform} for "${searchTerm}":`, error);
        errors.push({
          type: 'search_error',
          message: `Failed to scrape "${searchTerm}": ${error.message}`,
          timestamp: new Date()
        });
      }
    }

    // Process and save products
    const processedProducts = allProducts.map(product => ({
      platform,
      originalName: product.name,
      price: product.price,
      image: product.image,
      productUrl: product.link,
      deliveryTime: product.deliveryTime,
      location: { city, pincode },
      availability: true,
      currency: 'INR'
    }));

    // Group similar products and save to database
    const matchedGroups = matchProducts(processedProducts, 0.7);
    
    for (const group of matchedGroups) {
      try {
        const unifiedProduct = createUnifiedProduct(group);
        
        if (unifiedProduct) {
          // Check if product already exists
          const existingProduct = await Product.findOne({
            normalizedSearchKey: unifiedProduct.normalizedSearchKey,
            'location.city': city,
            'location.pincode': pincode
          });

          if (existingProduct) {
            // Update existing product
            for (const platformData of unifiedProduct.platforms) {
              await existingProduct.updatePlatformPrice(platformData);
            }
            productsUpdated++;
          } else {
            // Create new product
            const newProduct = new Product(unifiedProduct);
            await newProduct.save();
            productsAdded++;
          }
        }
      } catch (error) {
        console.error('Error saving product group:', error);
        errors.push({
          type: 'save_error',
          message: `Failed to save product: ${error.message}`,
          timestamp: new Date()
        });
      }
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Update scraping log
    if (logId) {
      await ScrapingLog.findByIdAndUpdate(logId, {
        status: errors.length > 0 ? 'partial' : 'success',
        endTime: new Date(),
        duration,
        productsScraped,
        productsUpdated,
        productsAdded,
        errors
      });
    }

    console.log(`✅ ${platform} scraping completed: ${productsScraped} scraped, ${productsAdded} added, ${productsUpdated} updated`);

    return {
      success: true,
      platform,
      productsScraped,
      productsAdded,
      productsUpdated,
      duration,
      errors
    };

  } catch (error) {
    console.error(`❌ Error scraping ${platform}:`, error);
    
    const endTime = Date.now();
    const duration = endTime - startTime;

    if (logId) {
      await ScrapingLog.findByIdAndUpdate(logId, {
        status: 'error',
        endTime: new Date(),
        duration,
        productsScraped,
        productsUpdated,
        productsAdded,
        errors: [...errors, {
          type: 'fatal_error',
          message: error.message,
          timestamp: new Date()
        }]
      });
    }

    return {
      success: false,
      platform,
      error: error.message,
      duration,
      errors
    };

  } finally {
    if (page) await page.close();
    if (browser) await browser.close();
  }
}

// Scrape all platforms
async function scrapeAllPlatforms(city, pincode, categories = null, logId = null) {
  const platforms = ['blinkit', 'zepto', 'instamart', 'bigbasket'];
  const results = [];

  for (const platform of platforms) {
    try {
      const result = await scrapePlatform(platform, city, pincode, categories, logId);
      results.push(result);
      
      // Add delay between platforms to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 5000));
      
    } catch (error) {
      console.error(`Error scraping ${platform}:`, error);
      results.push({
        success: false,
        platform,
        error: error.message
      });
    }
  }

  return results;
}

// Get scraping status
async function getScrapingStatus(logId) {
  try {
    const log = await ScrapingLog.findById(logId);
    return log;
  } catch (error) {
    console.error('Error getting scraping status:', error);
    throw error;
  }
}

// Get recent scraping logs
async function getRecentScrapingLogs(limit = 10) {
  try {
    const logs = await ScrapingLog.find()
      .sort({ startTime: -1 })
      .limit(limit);
    return logs;
  } catch (error) {
    console.error('Error getting scraping logs:', error);
    throw error;
  }
}

module.exports = {
  scrapePlatform,
  scrapeAllPlatforms,
  getScrapingStatus,
  getRecentScrapingLogs,
  SEARCH_CATEGORIES,
  PLATFORM_CONFIGS
};
