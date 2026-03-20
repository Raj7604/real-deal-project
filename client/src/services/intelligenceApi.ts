import axios from 'axios';
import { PriceInsight, SearchEnhancement, PlatformIntelligence, PersonalizedRecommendation } from '../types/intelligence';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const intelligenceApi = {
  // Get price insights for a product
  getInsights: async (productId: string, city: string, pincode: string): Promise<{ success: boolean; data: PriceInsight[] }> => {
    const response = await api.get(`/intelligence/insights/${productId}?city=${encodeURIComponent(city)}&pincode=${encodeURIComponent(pincode)}`);
    return response.data;
  },

  // Enhanced search with AI-powered suggestions
  enhanceSearch: async (query: string, city: string, pincode: string): Promise<{ success: boolean; data: SearchEnhancement }> => {
    const response = await api.post('/intelligence/enhanced-search', {
      query,
      city,
      pincode
    });
    return response.data;
  },

  // Get platform intelligence for location
  getPlatformIntelligence: async (city: string, pincode: string, category?: string): Promise<{ success: boolean; data: PlatformIntelligence[] }> => {
    const params = new URLSearchParams({
      city,
      pincode,
      ...(category && { category })
    });
    
    const response = await api.get(`/intelligence/platform-intelligence/${city}/${pincode}?${params}`);
    return response.data;
  },

  // Get personalized recommendations
  getRecommendations: async (sessionId: string, city: string, pincode: string, limit = 10): Promise<{ success: boolean; data: PersonalizedRecommendation[] }> => {
    const params = new URLSearchParams({
      city,
      pincode,
      limit: limit.toString()
    });
    
    const response = await api.get(`/intelligence/recommendations/${sessionId}?${params}`);
    return response.data;
  },

  // Track user behavior
  trackEvent: async (sessionId: string, city: string, pincode: string, eventType: string, data: any): Promise<{ success: boolean; message: string }> => {
    const response = await api.post(`/intelligence/track/${sessionId}?city=${encodeURIComponent(city)}&pincode=${encodeURIComponent(pincode)}`, {
      eventType,
      data
    });
    return response.data;
  },

  // Update user preferences
  updatePreferences: async (sessionId: string, preferences: any): Promise<{ success: boolean; message: string }> => {
    const response = await api.post(`/intelligence/preferences/${sessionId}`, {
      preferences
    });
    return response.data;
  },

  // Get price trends for multiple products
  getTrends: async (productIds: string[], city: string, pincode: string, period = 'week'): Promise<{ success: boolean; data: Record<string, any> }> => {
    const response = await api.post('/intelligence/trends', {
      productIds,
      city,
      pincode,
      period
    });
    return response.data;
  },

  // Get best time to buy recommendations
  getBestTimeToBuy: async (productId: string, city: string, pincode: string): Promise<{ success: boolean; data: any }> => {
    const response = await api.get(`/intelligence/best-time-to-buy/${productId}?city=${encodeURIComponent(city)}&pincode=${encodeURIComponent(pincode)}`);
    return response.data;
  },

  // Get market insights for location
  getMarketInsights: async (city: string, pincode: string): Promise<{ success: boolean; data: { platformIntelligence: PlatformIntelligence[]; recentInsights: PriceInsight[]; location: { city: string; pincode: string } } }> => {
    const response = await api.get(`/intelligence/market-insights/${city}/${pincode}`);
    return response.data;
  },

  // Clear intelligence cache (admin endpoint)
  clearCache: async (): Promise<{ success: boolean; message: string; data: any }> => {
    const response = await api.post('/intelligence/cache/clear');
    return response.data;
  },
};

// Utility functions for displaying insights
export const formatInsightDescription = (insight: PriceInsight): string => {
  switch (insight.insightType) {
    case 'price_trend':
      if (insight.data.trend?.direction === 'up') {
        return `📈 Price increased by ${insight.data.trend.percentage.toFixed(1)}% this ${insight.data.trend.period}`;
      } else if (insight.data.trend?.direction === 'down') {
        return `📉 Price decreased by ${insight.data.trend.percentage.toFixed(1)}% this ${insight.data.trend.period}`;
      } else {
        return `📊 Price remained stable this ${insight.data.trend?.period || 'period'}`;
      }
    
    case 'best_time_to_buy':
      return `⏰ Best time to buy: ${insight.data.timing?.bestDay} ${insight.data.timing?.bestTime} (Save ₹${insight.data.timing?.averageSavings || 0})`;
    
    case 'platform_preference':
      return `🏪 ${insight.data.platform?.name} is generally ${insight.data.platform?.advantage === 'price' ? 'cheaper' : 'better'} by ${insight.data.platform?.percentage}%`;
    
    case 'price_volatility':
      return `📊 Price volatility: ${insight.data.volatility?.frequency} (${(insight.data.volatility?.index || 0)}/10)`;
    
    case 'savings_opportunity':
      return `💰 Save ₹${insight.data.savings?.potentialAmount || 0} (${insight.data.savings?.potentialPercentage || 0}%) by ${insight.data.savings?.recommendedAction || 'switching platforms'}`;
    
    default:
      return insight.description;
  }
};

export const getInsightIcon = (insightType: string): string => {
  switch (insightType) {
    case 'price_trend':
      return '📈';
    case 'best_time_to_buy':
      return '⏰';
    case 'platform_preference':
      return '🏪';
    case 'price_volatility':
      return '📊';
    case 'savings_opportunity':
      return '💰';
    default:
      return '💡';
  }
};

export const getConfidenceColor = (confidence: number): string => {
  if (confidence >= 0.8) return 'text-green-600';
  if (confidence >= 0.6) return 'text-yellow-600';
  return 'text-red-600';
};

export const getConfidenceLabel = (confidence: number): string => {
  if (confidence >= 0.8) return 'High';
  if (confidence >= 0.6) return 'Medium';
  return 'Low';
};
