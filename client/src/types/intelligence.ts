export interface PriceInsight {
  _id: string;
  productId: string;
  location: {
    city: string;
    pincode: string;
  };
  insightType: 'price_trend' | 'best_time_to_buy' | 'platform_preference' | 'price_volatility' | 'savings_opportunity';
  title: string;
  description: string;
  confidence: number;
  data: {
    trend?: {
      direction: 'up' | 'down' | 'stable';
      percentage: number;
      period: string;
      dataPoints: Array<{
        date: string;
        price: number;
        platform: string;
      }>;
    };
    timing?: {
      bestDay: string;
      bestTime: string;
      averageSavings: number;
    };
    platform?: {
      name: string;
      advantage: 'price' | 'delivery' | 'availability' | 'variety';
      percentage: number;
      categories: string[];
    };
    volatility?: {
      index: number;
      range: {
        min: number;
        max: number;
        average: number;
      };
      frequency: 'high' | 'medium' | 'low';
    };
    savings?: {
      potentialAmount: number;
      potentialPercentage: number;
      recommendedAction: string;
      targetPlatform: string;
    };
  };
  isActive: boolean;
  validUntil: string;
  generatedAt: string;
  metadata: {
    algorithm: string;
    version: string;
    dataPoints: number;
    confidenceLevel: string;
  };
}

export interface SearchEnhancement {
  synonyms: string[];
  corrections: string[];
  suggestions: string[];
}

export interface PlatformIntelligence {
  name: string;
  avgPrice: number;
  productCount: number;
  categories: string[];
  advantage: 'price' | 'delivery' | 'availability' | 'variety' | 'balanced';
  percentage: number;
}

export interface PersonalizedRecommendation {
  type: 'based_on_history' | 'platform_preference' | 'price_drop' | 'category_trend';
  title: string;
  description?: string;
  products?: any[];
  confidence: number;
}

export interface UserEvent {
  type: 'search' | 'product_view' | 'comparison' | 'platform_click' | 'filter_change' | 'sort_change';
  timestamp: string;
  data: {
    query?: string;
    productId?: string;
    productIds?: string[];
    platform?: string;
    filters?: any;
    sortBy?: string;
    resultCount?: number;
    duration?: number;
    converted?: boolean;
  };
}

export interface UserPreferences {
  favoriteCategories: string[];
  favoriteBrands: string[];
  preferredPlatforms: string[];
  priceSensitivity: 'low' | 'medium' | 'high';
  deliveryPriority: 'price' | 'speed' | 'balanced';
}
