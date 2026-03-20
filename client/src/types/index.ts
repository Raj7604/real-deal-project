export interface PlatformPrice {
  platform: 'blinkit' | 'zepto' | 'instamart' | 'bigbasket';
  price: number;
  originalName: string;
  imageUrl?: string;
  productUrl?: string;
  deliveryTime?: string;
  availability: boolean;
  lastUpdated: string;
  currency: string;
}

export interface Location {
  city: string;
  pincode: string;
  state?: string;
}

export interface Product {
  _id: string;
  name: string;
  normalizedSearchKey: string;
  category: string;
  brand: string;
  quantity: number;
  unit: string;
  standardizedQuantity: number;
  standardizedUnit: string;
  image?: string;
  description?: string;
  platforms: PlatformPrice[];
  location: Location;
  priority: 'high' | 'medium' | 'low';
  tags: string[];
  lastScraped: string;
  priceHistory: Array<{
    platform: string;
    price: number;
    date: string;
  }>;
  cheapestPrice?: PlatformPrice;
  priceRange?: {
    min: number;
    max: number;
    difference: number;
  };
  maxSavings: number;
  cheapestPlatform?: string;
  savings?: number;
  savingsPercentage?: string;
}

export interface ProductComparison {
  product: {
    id: string;
    name: string;
    brand: string;
    category: string;
    quantity: number;
    unit: string;
    image?: string;
    location: Location;
  };
  platforms: Array<PlatformPrice & {
    isCheapest: boolean;
    savings: number;
    savingsPercentage: number;
    rank: number;
  }>;
  priceRange: {
    min: number;
    max: number;
    difference: number;
  };
  maxSavings: number;
  totalPlatforms: number;
}

export interface SearchResponse {
  success: boolean;
  data: Product[];
  query: string;
  city: string;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
  error?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  message?: string;
}

export interface LocationData {
  _id: string;
  city: string;
  state: string;
  pincodes: string[];
  isActive: boolean;
  supportedPlatforms: string[];
  defaultPincode: string;
  timezone: string;
  metadata?: {
    population?: number;
    area?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
}

export interface SearchFilters {
  category?: string;
  brand?: string;
  sortBy?: 'relevance' | 'price_low' | 'price_high' | 'newest';
  limit?: number;
  page?: number;
}

export interface ScrapingLog {
  _id: string;
  platform: string;
  location: Location;
  status: 'success' | 'error' | 'partial' | 'running';
  startTime: string;
  endTime?: string;
  duration?: number;
  productsScraped: number;
  productsUpdated: number;
  productsAdded: number;
  errors: Array<{
    type: string;
    message: string;
    timestamp: string;
  }>;
  metadata: {
    userAgent?: string;
    proxyUsed?: string;
    categoriesScraped?: string[];
    totalProductsFound?: number;
    duplicateProductsFound?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  database: {
    status: string;
    host?: string;
    port?: number;
    name?: string;
  };
  uptime: number;
}

export type PlatformName = 'blinkit' | 'zepto' | 'instamart' | 'bigbasket';
