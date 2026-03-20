const _ = require('lodash');

// Common words to remove from product names
const STOP_WORDS = new Set([
  'fresh', 'best', 'premium', 'quality', 'natural', 'organic', 'pure',
  'homemade', 'delicious', 'tasty', 'yummy', 'special', 'combo', 'pack',
  'packet', 'piece', 'pieces', 'item', 'items', 'brand', 'new', 'latest',
  'original', 'authentic', 'traditional', 'imported', 'local', 'indian',
  'desi', 'hygienic', 'clean', 'healthy', 'nutritious', 'rich', 'deluxe',
  'super', 'extra', 'plus', 'pro', 'max', 'mini', 'small', 'large', 'medium',
  'regular', 'standard', 'classic', 'basic', 'simple', 'easy', 'quick',
  'instant', 'ready', 'cooked', 'raw', 'dried', 'frozen', 'chilled',
  'preserved', 'processed', 'refined', 'unrefined', 'whole', 'split',
  'ground', 'powder', 'liquid', 'solid', 'soft', 'hard', 'crunchy',
  'smooth', 'creamy', 'thick', 'thin', 'light', 'heavy', 'strong', 'mild'
]);

// Common brand names for recognition
const COMMON_BRANDS = new Set([
  'amul', 'mother dairy', 'nestle', 'britannia', 'parle', 'itc', 'hindustan unilever',
  'p&g', 'dabur', 'patanjali', 'haldiram', 'bikaji', 'lays', 'pepsi', 'coca cola',
  'cadbury', 'kitkat', 'mars', 'oreo', 'sunfeast', 'mariegold', 'good day',
  'tata', 'aashirvaad', 'fortune', 'saffola', 'dhara', 'naturefresh', 'himalaya',
  'margo', 'medimix', 'cinthol', 'lifebuoy', 'dettol', 'savlon', 'colgate',
  'pepsodent', 'closeup', 'sensodyne', 'oral-b', 'gillette', 'axe', 'denver',
  'park avenue', 'wild stone', 'fogg', 'yardley', 'nivea', 'ponds', 'lakme',
  'loreal', 'maybelline', 'revlon', 'colorbar', 'nykaa', 'mamaearth', 'biotique',
  'himalaya', 'patanjali', 'dabur', 'zandu', 'baidyanath', 'shree dhanwantri',
  'micromax', 'samsung', 'lg', 'whirlpool', 'godrej', 'voltas', 'blue star',
  'philips', 'panasonic', 'sony', 'canon', 'nikon', 'hp', 'dell', 'lenovo',
  'acer', 'asus', 'apple', 'xiaomi', 'oneplus', 'vivo', 'oppo', 'realme'
]);

// Category mapping
const CATEGORY_KEYWORDS = {
  'dairy': ['milk', 'curd', 'yogurt', 'cheese', 'butter', 'ghee', 'paneer', 'cream'],
  'vegetables': ['vegetable', 'veg', 'tomato', 'potato', 'onion', 'garlic', 'ginger', 'carrot', 'cabbage', 'cauliflower', 'spinach', 'ladyfinger'],
  'fruits': ['fruit', 'apple', 'banana', 'orange', 'mango', 'grapes', 'papaya', 'pineapple', 'watermelon'],
  'grains': ['rice', 'wheat', 'flour', 'atta', 'maida', 'sooji', 'rava', 'dalia', 'oats', 'dalia'],
  'pulses': ['dal', 'lentil', 'pulse', 'gram', 'chana', 'moong', 'masoor', 'urad', 'toor', 'arhar'],
  'spices': ['spice', 'masala', 'turmeric', 'haldi', 'chilli', 'mirch', 'coriander', 'dhania', 'cumin', 'jeera', 'pepper'],
  'oil': ['oil', 'refined oil', 'mustard oil', 'sunflower oil', 'groundnut oil', 'coconut oil', 'ghee'],
  'snacks': ['snack', 'chips', 'biscuit', 'cookie', 'namkeen', 'samosa', 'kachori', 'bhujia'],
  'beverages': ['tea', 'coffee', 'juice', 'drink', 'cold drink', 'soft drink', 'energy drink'],
  'personal_care': ['soap', 'shampoo', 'toothpaste', 'cream', 'lotion', 'oil', 'perfume', 'deodorant'],
  'cleaning': ['detergent', 'soap', 'cleaner', 'phenyl', 'bleach', 'dishwash', 'floor cleaner'],
  'baby': ['baby', 'infant', 'diaper', 'milk powder', 'baby food', 'baby oil', 'baby cream']
};

// Unit conversion factors
const UNIT_CONVERSIONS = {
  'kg': 1000,
  'kilogram': 1000,
  'kilograms': 1000,
  'g': 1,
  'gram': 1,
  'grams': 1,
  'l': 1000,
  'liter': 1000,
  'liters': 1000,
  'litre': 1000,
  'litres': 1000,
  'ml': 1,
  'milliliter': 1,
  'milliliters': 1,
  'millilitre': 1,
  'millilitres': 1,
  'pcs': 1,
  'pieces': 1,
  'piece': 1,
  'pc': 1,
  'nos': 1,
  'numbers': 1,
  'pack': 1,
  'packs': 1,
  'packet': 1,
  'packets': 1,
  'box': 1,
  'boxes': 1,
  'bottle': 1,
  'bottles': 1,
  'jar': 1,
  'jars': 1,
  'tin': 1,
  'tins': 1,
  'can': 1,
  'cans': 1,
  'carton': 1,
  'cartons': 1
};

// Normalize product name
function normalizeProductName(productName) {
  if (!productName || typeof productName !== 'string') {
    return '';
  }

  // Convert to lowercase and remove extra spaces
  let normalized = productName.toLowerCase().trim().replace(/\s+/g, ' ');

  // Remove special characters except hyphens and spaces
  normalized = normalized.replace(/[^a-z0-9\s\-]/g, '');

  // Remove stop words
  const words = normalized.split(' ').filter(word => !STOP_WORDS.has(word));

  // Remove quantity information (will be extracted separately)
  const filteredWords = words.filter(word => {
    // Remove if it's a number followed by unit
    if (/^\d+/.test(word)) return false;
    // Remove if it's a common unit
    if (UNIT_CONVERSIONS[word]) return false;
    return true;
  });

  return filteredWords.join(' ').trim();
}

// Extract quantity from product name
function extractQuantity(productName) {
  if (!productName || typeof productName !== 'string') {
    return { quantity: 0, unit: 'pcs' };
  }

  const text = productName.toLowerCase();
  
  // Pattern to match quantity (number + unit)
  const quantityPatterns = [
    /(\d+(?:\.\d+)?)\s*(kg|kilogram|kilograms|g|gram|grams)\b/,
    /(\d+(?:\.\d+)?)\s*(l|liter|liters|litre|litres|ml|milliliter|milliliters|millilitre|millilitres)\b/,
    /(\d+(?:\.\d+)?)\s*(pcs|pieces|piece|pc|nos|numbers|pack|packs|packet|packets)\b/,
    /(\d+(?:\.\d+)?)\s*(box|boxes|bottle|bottles|jar|jars|tin|tins|can|cans|carton|cartons)\b/
  ];

  for (const pattern of quantityPatterns) {
    const match = text.match(pattern);
    if (match) {
      const quantity = parseFloat(match[1]);
      const unit = match[2];
      
      return {
        quantity,
        unit: unit.toLowerCase(),
        standardizedQuantity: quantity * (UNIT_CONVERSIONS[unit] || 1),
        standardizedUnit: getStandardizedUnit(unit)
      };
    }
  }

  return { quantity: 0, unit: 'pcs', standardizedQuantity: 0, standardizedUnit: 'g' };
}

// Get standardized unit
function getStandardizedUnit(unit) {
  unit = unit.toLowerCase();
  
  if (['kg', 'kilogram', 'kilograms', 'g', 'gram', 'grams'].includes(unit)) {
    return 'g';
  }
  if (['l', 'liter', 'liters', 'litre', 'litres', 'ml', 'milliliter', 'milliliters', 'millilitre', 'millilitres'].includes(unit)) {
    return 'ml';
  }
  
  return 'g'; // Default to grams for other units
}

// Extract brand from product name
function extractBrand(productName) {
  if (!productName || typeof productName !== 'string') {
    return '';
  }

  const text = productName.toLowerCase();
  
  // Check for common brands
  for (const brand of COMMON_BRANDS) {
    if (text.includes(brand)) {
      return brand;
    }
  }

  // Try to extract brand from first word(s) if it looks like a brand
  const words = text.split(' ').filter(word => word.length > 2);
  if (words.length > 0) {
    // Common brand name patterns
    const firstWord = words[0];
    if (firstWord.length >= 3 && firstWord.length <= 15 && /^[a-z]+$/.test(firstWord)) {
      return firstWord;
    }
  }

  return '';
}

// Extract category from product name
function extractCategory(productName) {
  if (!productName || typeof productName !== 'string') {
    return 'miscellaneous';
  }

  const text = productName.toLowerCase();
  
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        return category;
      }
    }
  }

  return 'miscellaneous';
}

// Calculate similarity between two product names
function calculateSimilarity(name1, name2) {
  if (!name1 || !name2) return 0;

  const normalized1 = normalizeProductName(name1);
  const normalized2 = normalizeProductName(name2);

  // Jaccard similarity
  const words1 = new Set(normalized1.split(' '));
  const words2 = new Set(normalized2.split(' '));

  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);

  const jaccardSimilarity = intersection.size / union.size;

  // Edit distance similarity
  const editDistance = levenshteinDistance(normalized1, normalized2);
  const maxLength = Math.max(normalized1.length, normalized2.length);
  const editSimilarity = 1 - (editDistance / maxLength);

  // Weighted average (Jaccard gets more weight for word matching)
  return (jaccardSimilarity * 0.7) + (editSimilarity * 0.3);
}

// Calculate Levenshtein distance
function levenshteinDistance(str1, str2) {
  const matrix = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

// Calculate product matching score
function calculateProductMatchScore(product1, product2) {
  let score = 0;
  let maxScore = 0;

  // Category match (weight: 0.3)
  maxScore += 0.3;
  if (product1.category === product2.category) {
    score += 0.3;
  }

  // Brand match (weight: 0.3)
  maxScore += 0.3;
  if (product1.brand && product2.brand && product1.brand === product2.brand) {
    score += 0.3;
  } else if (product1.brand && product2.brand && calculateSimilarity(product1.brand, product2.brand) > 0.7) {
    score += 0.2; // Partial brand match
  }

  // Quantity match (weight: 0.2)
  maxScore += 0.2;
  if (product1.standardizedUnit === product2.standardizedUnit) {
    const quantityDiff = Math.abs(product1.standardizedQuantity - product2.standardizedQuantity);
    const avgQuantity = (product1.standardizedQuantity + product2.standardizedQuantity) / 2;
    const quantitySimilarity = 1 - (quantityDiff / avgQuantity);
    score += 0.2 * Math.max(0, quantitySimilarity);
  }

  // Name similarity (weight: 0.2)
  maxScore += 0.2;
  const nameSimilarity = calculateSimilarity(product1.name, product2.name);
  score += 0.2 * nameSimilarity;

  return score / maxScore;
}

// Match products across platforms
function matchProducts(products, threshold = 0.7) {
  const matchedGroups = [];
  const usedProducts = new Set();

  for (let i = 0; i < products.length; i++) {
    if (usedProducts.has(i)) continue;

    const group = [products[i]];
    usedProducts.add(i);

    for (let j = i + 1; j < products.length; j++) {
      if (usedProducts.has(j)) continue;

      const score = calculateProductMatchScore(products[i], products[j]);
      if (score >= threshold) {
        group.push(products[j]);
        usedProducts.add(j);
      }
    }

    matchedGroups.push(group);
  }

  return matchedGroups;
}

// Create unified product from matched group
function createUnifiedProduct(group) {
  if (!group || group.length === 0) return null;

  const firstProduct = group[0];
  
  // Use the first product as base, but merge platform data
  const unifiedProduct = {
    name: normalizeProductName(firstProduct.originalName),
    normalizedSearchKey: normalizeProductName(firstProduct.originalName),
    category: firstProduct.category || extractCategory(firstProduct.originalName),
    brand: firstProduct.brand || extractBrand(firstProduct.originalName),
    quantity: firstProduct.quantity,
    unit: firstProduct.unit,
    standardizedQuantity: firstProduct.standardizedQuantity,
    standardizedUnit: firstProduct.standardizedUnit,
    image: firstProduct.image,
    platforms: [],
    location: firstProduct.location,
    priority: firstProduct.priority || 'medium'
  };

  // Add all platform data
  for (const product of group) {
    unifiedProduct.platforms.push({
      platform: product.platform,
      price: product.price,
      originalName: product.originalName,
      imageUrl: product.image,
      productUrl: product.productUrl,
      deliveryTime: product.deliveryTime,
      availability: product.availability !== false,
      lastUpdated: new Date(),
      currency: product.currency || 'INR'
    });
  }

  return unifiedProduct;
}

module.exports = {
  normalizeProductName,
  extractQuantity,
  extractBrand,
  extractCategory,
  calculateSimilarity,
  calculateProductMatchScore,
  matchProducts,
  createUnifiedProduct,
  STOP_WORDS,
  COMMON_BRANDS,
  CATEGORY_KEYWORDS,
  UNIT_CONVERSIONS
};
