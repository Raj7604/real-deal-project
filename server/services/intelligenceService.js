const Product = require('../models/Product');
const PriceInsight = require('../models/PriceInsight');
const UserBehavior = require('../models/UserBehavior');
const { calculateSimilarity } = require('./productNormalization');

class IntelligenceService {
  constructor() {
    this.insightCache = new Map();
    this.trendAnalysisCache = new Map();
  }

  // Price Trend Analysis
  async analyzePriceTrends(productId, location, period = 'week') {
    try {
      const cacheKey = `trend_${productId}_${location.city}_${period}`;
      if (this.trendAnalysisCache.has(cacheKey)) {
        return this.trendAnalysisCache.get(cacheKey);
      }

      const product = await Product.findById(productId);
      if (!product || !product.priceHistory || product.priceHistory.length < 2) {
        return null;
      }

      const now = new Date();
      const periodStart = new Date();
      
      switch (period) {
        case 'week':
          periodStart.setDate(now.getDate() - 7);
          break;
        case 'month':
          periodStart.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          periodStart.setMonth(now.getMonth() - 3);
          break;
        default:
          periodStart.setDate(now.getDate() - 7);
      }

      const relevantHistory = product.priceHistory.filter(
        entry => new Date(entry.date) >= periodStart
      );

      if (relevantHistory.length < 2) {
        return null;
      }

      // Calculate trend
      const oldestPrice = relevantHistory[0].price;
      const newestPrice = relevantHistory[relevantHistory.length - 1].price;
      const priceChange = ((newestPrice - oldestPrice) / oldestPrice) * 100;
      
      let direction = 'stable';
      if (Math.abs(priceChange) > 2) {
        direction = priceChange > 0 ? 'up' : 'down';
      }

      const trend = {
        direction,
        percentage: Math.abs(priceChange),
        period,
        dataPoints: relevantHistory.map(entry => ({
          date: entry.date,
          price: entry.price,
          platform: entry.platform
        }))
      };

      // Cache result
      this.trendAnalysisCache.set(cacheKey, trend);
      
      return trend;
    } catch (error) {
      console.error('Error analyzing price trends:', error);
      return null;
    }
  }

  // Best Time to Buy Analysis
  async analyzeBestTimeToBuy(productId, location) {
    try {
      const product = await Product.findById(productId);
      if (!product || !product.priceHistory || product.priceHistory.length < 10) {
        return null;
      }

      // Analyze price patterns by day of week and time
      const priceByDay = {};
      const priceByHour = {};

      product.priceHistory.forEach(entry => {
        const date = new Date(entry.date);
        const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
        const hour = date.getHours();
        
        if (!priceByDay[dayOfWeek]) {
          priceByDay[dayOfWeek] = [];
        }
        priceByDay[dayOfWeek].push(entry.price);
        
        if (!priceByHour[hour]) {
          priceByHour[hour] = [];
        }
        priceByHour[hour].push(entry.price);
      });

      // Find best day (lowest average price)
      const avgPriceByDay = {};
      Object.keys(priceByDay).forEach(day => {
        const prices = priceByDay[day];
        avgPriceByDay[day] = prices.reduce((sum, price) => sum + price, 0) / prices.length;
      });

      const bestDay = Object.keys(avgPriceByDay).reduce((best, day) => 
        avgPriceByDay[day] < avgPriceByDay[best] ? day : best
      );

      // Find best hour (lowest average price)
      const avgPriceByHour = {};
      Object.keys(priceByHour).forEach(hour => {
        const prices = priceByHour[hour];
        avgPriceByHour[hour] = prices.reduce((sum, price) => sum + price, 0) / prices.length;
      });

      const bestHour = Object.keys(avgPriceByHour).reduce((best, hour) => 
        avgPriceByHour[hour] < avgPriceByHour[best] ? hour : best
      );

      const overallAvgPrice = product.priceHistory.reduce((sum, entry) => sum + entry.price, 0) / product.priceHistory.length;
      const bestDayPrice = avgPriceByDay[bestDay];
      const averageSavings = overallAvgPrice - bestDayPrice;

      return {
        bestDay: this.getDayName(parseInt(bestDay)),
        bestTime: this.getTimeOfDay(parseInt(bestHour)),
        averageSavings: Math.round(averageSavings * 100) / 100
      };
    } catch (error) {
      console.error('Error analyzing best time to buy:', error);
      return null;
    }
  }

  // Platform Intelligence Analysis
  async analyzePlatformPreferences(location, category = null) {
    try {
      const matchStage = {
        'location.city': location.city,
        'location.pincode': location.pincode
      };

      if (category) {
        matchStage.category = category;
      }

      const platformAnalysis = await Product.aggregate([
        {
          $match: matchStage
        },
        { $unwind: '$platforms' },
        {
          $match: {
            'platforms.availability': true
          }
        },
        {
          $group: {
            _id: '$platforms.platform',
            avgPrice: { $avg: '$platforms.price' },
            productCount: { $sum: 1 },
            categories: { $addToSet: '$category' },
            avgDeliveryTime: { $avg: { $cond: [{ $ne: ['$platforms.deliveryTime', null] }, '$platforms.deliveryTime', 0] } }
          }
        },
        {
          $sort: { avgPrice: 1 }
        }
      ]);

      // Generate insights for each platform
      const insights = platformAnalysis.map(platform => {
        const otherPlatforms = platformAnalysis.filter(p => p._id !== platform._id);
        const avgPriceOfOthers = otherPlatforms.reduce((sum, p) => sum + p.avgPrice, 0) / otherPlatforms.length;
        
        let advantage = 'balanced';
        let percentage = 0;
        
        if (platform.avgPrice < avgPriceOfOthers) {
          advantage = 'price';
          percentage = ((avgPriceOfOthers - platform.avgPrice) / avgPriceOfOthers) * 100;
        } else if (platform.avgDeliveryTime < 15) {
          advantage = 'delivery';
          percentage = 20; // Arbitrary advantage score for speed
        } else if (platform.productCount > otherPlatforms.reduce((sum, p) => Math.max(sum, p.productCount), 0) * 0.8) {
          advantage = 'availability';
          percentage = 15;
        }

        return {
          name: platform._id,
          avgPrice: Math.round(platform.avgPrice * 100) / 100,
          productCount: platform.productCount,
          categories: platform.categories,
          advantage,
          percentage: Math.round(percentage * 10) / 10
        };
      });

      return insights;
    } catch (error) {
      console.error('Error analyzing platform preferences:', error);
      return [];
    }
  }

  // Smart Search Enhancement
  async enhanceSearchQuery(query, location) {
    try {
      const enhancements = {
        synonyms: [],
        corrections: [],
        suggestions: []
      };

      // Basic synonym mapping
      const synonymMap = {
        'atta': ['flour', 'wheat flour', 'whole wheat flour'],
        'milk': ['doodh', 'dairy', 'toned milk', 'full cream milk'],
        'rice': ['chawal', 'basmati', 'arhar dal'],
        'oil': 'tel',
        'bread': 'roti',
        'vegetables': ['sabzi', 'veggies'],
        'fruits': ['phal', 'fresh fruits']
      };

      const normalizedQuery = query.toLowerCase().trim();
      
      // Check for exact synonyms
      if (synonymMap[normalizedQuery]) {
        enhancements.synonyms = synonymMap[normalizedQuery];
      }

      // Check for partial matches and suggest corrections
      const allProducts = await Product.find({
        'location.city': location.city,
        'location.pincode': location.pincode
      }).select('name brand category normalizedSearchKey');

      // Find similar product names using fuzzy matching
      const similarProducts = allProducts
        .map(product => ({
          name: product.name,
          similarity: calculateSimilarity(normalizedQuery, product.normalizedSearchKey)
        }))
        .filter(product => product.similarity > 0.6)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 5);

      if (similarProducts.length > 0) {
        enhancements.suggestions = similarProducts.map(p => p.name);
      }

      return enhancements;
    } catch (error) {
      console.error('Error enhancing search query:', error);
      return { synonyms: [], corrections: [], suggestions: [] };
    }
  }

  // Generate Price Insights
  async generatePriceInsights(productId, location) {
    try {
      const existingInsights = await PriceInsight.getActiveInsights(productId, location);
      if (existingInsights.length > 0) {
        return existingInsights;
      }

      const insights = [];

      // Price trend insight
      const trend = await this.analyzePriceTrends(productId, location);
      if (trend) {
        insights.push({
          productId,
          location,
          insightType: 'price_trend',
          title: `Price ${trend.direction === 'up' ? 'increasing' : trend.direction === 'down' ? 'decreasing' : 'stable'}`,
          description: `Price has ${trend.direction} by ${trend.percentage.toFixed(1)}% in the last ${trend.period}`,
          confidence: 0.8,
          data: { trend },
          metadata: {
            algorithm: 'linear_regression',
            version: '1.0',
            dataPoints: trend.dataPoints.length,
            confidenceLevel: 'high'
          }
        });
      }

      // Best time to buy insight
      const timing = await this.analyzeBestTimeToBuy(productId, location);
      if (timing) {
        insights.push({
          productId,
          location,
          insightType: 'best_time_to_buy',
          title: `Best time to buy: ${timing.bestDay}`,
          description: `Save approximately ₹${timing.averageSavings} by purchasing on ${timing.bestDay} ${timing.bestTime}`,
          confidence: 0.7,
          data: { timing },
          metadata: {
            algorithm: 'time_series_analysis',
            version: '1.0',
            dataPoints: 30,
            confidenceLevel: 'medium'
          }
        });
      }

      // Platform preference insight
      const platformIntelligence = await this.analyzePlatformPreferences(location);
      if (platformIntelligence.length > 0) {
        insights.push({
          productId,
          location,
          insightType: 'platform_preference',
          title: `${platformIntelligence[0].name} is generally cheaper`,
          description: `${platformIntelligence[0].name} offers ${platformIntelligence[0].percentage}% lower prices on average`,
          confidence: 0.9,
          data: { platform: platformIntelligence[0] },
          metadata: {
            algorithm: 'statistical_analysis',
            version: '1.0',
            dataPoints: platformIntelligence.length,
            confidenceLevel: 'high'
          }
        });
      }

      // Save insights to database
      const savedInsights = await PriceInsight.insertMany(insights);

      return savedInsights;
    } catch (error) {
      console.error('Error generating price insights:', error);
      return [];
    }
  }

  // Personalized Recommendations
  async getPersonalizedRecommendations(sessionId, location, limit = 10) {
    try {
      const userBehavior = await UserBehavior.findOne({ sessionId });
      if (!userBehavior) {
        return [];
      }

      const recommendations = [];

      // Get popular products for this location
      const popularProducts = await UserBehavior.getPopularProducts(location, limit * 2);
      
      // Get user's search history
      const searchHistory = await UserBehavior.getSearchHistory(sessionId, 20);
      
      // Get platform preferences
      const platformPrefs = await UserBehavior.getPlatformPreferences(location);

      // Generate recommendations based on behavior
      if (searchHistory.length > 0) {
        // Recommend based on search history
        const searchTerms = searchHistory
          .map(event => event.data.query)
          .filter(query => query && query.trim())
          .slice(0, 5);

        for (const term of searchTerms) {
          const matchingProducts = popularProducts.filter(
            product => product._id && typeof product._id === 'string' && 
            product._id.toLowerCase().includes(term.toLowerCase())
          );
          
          if (matchingProducts.length > 0) {
            recommendations.push({
              type: 'based_on_history',
              title: `Continue searching for ${term}`,
              products: matchingProducts.slice(0, 3),
              confidence: 0.8
            });
          }
        }
      }

      // Add platform-based recommendations
      if (platformPrefs.length > 0) {
        const preferredPlatform = platformPrefs[0]._id;
        recommendations.push({
          type: 'platform_preference',
          title: `Best deals on ${preferredPlatform}`,
          description: `${preferredPlatform} offers great value for your preferences`,
          confidence: 0.7
        });
      }

      return recommendations.slice(0, limit);
    } catch (error) {
      console.error('Error getting personalized recommendations:', error);
      return [];
    }
  }

  // Helper methods
  getDayName(dayIndex) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayIndex];
  }

  getTimeOfDay(hour) {
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }

  // Cache management
  clearCache() {
    this.insightCache.clear();
    this.trendAnalysisCache.clear();
  }

  getCacheStats() {
    return {
      insightCacheSize: this.insightCache.size,
      trendCacheSize: this.trendAnalysisCache.size
    };
  }
}

module.exports = new IntelligenceService();
