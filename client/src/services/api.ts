import axios from 'axios';
import { Product, SearchResponse, ProductComparison, LocationData, SearchFilters, ApiResponse, ErrorResponse, HealthStatus } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Product API
export const productApi = {
  search: async (query: string, city: string, filters?: SearchFilters): Promise<SearchResponse> => {
    const params = new URLSearchParams({
      q: query,
      city,
      ...(filters?.category && { category: filters.category }),
      ...(filters?.brand && { brand: filters.brand }),
      ...(filters?.sortBy && { sortBy: filters.sortBy }),
      ...(filters?.limit && { limit: filters.limit.toString() }),
      ...(filters?.page && { page: filters.page.toString() }),
    });

    const response = await api.get<SearchResponse>(`/products/search?${params}`);
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<Product>> => {
    const response = await api.get<ApiResponse<Product>>(`/products/${id}`);
    return response.data;
  },

  compare: async (id: string): Promise<ApiResponse<ProductComparison>> => {
    const response = await api.get<ApiResponse<ProductComparison>>(`/products/${id}/compare`);
    return response.data;
  },

  getPopular: async (city: string, limit = 10): Promise<ApiResponse<Product[]>> => {
    const response = await api.get<ApiResponse<Product[]>>(`/products/popular/${city}?limit=${limit}`);
    return response.data;
  },

  getCategories: async (city: string): Promise<ApiResponse<string[]>> => {
    const response = await api.get<ApiResponse<string[]>>(`/products/categories/${city}`);
    return response.data;
  },

  getBrands: async (city: string, category?: string): Promise<ApiResponse<string[]>> => {
    const params = category ? `?category=${category}` : '';
    const response = await api.get<ApiResponse<string[]>>(`/products/brands/${city}${params}`);
    return response.data;
  },

  getSuggestions: async (query: string, city: string, limit = 10): Promise<ApiResponse<Product[]>> => {
    const params = `?q=${encodeURIComponent(query)}&city=${encodeURIComponent(city)}&limit=${limit}`;
    const response = await api.get<ApiResponse<Product[]>>(`/products/suggestions${params}`);
    return response.data;
  },
};

// Location API
export const locationApi = {
  getCities: async (): Promise<ApiResponse<LocationData[]>> => {
    const response = await api.get<ApiResponse<LocationData[]>>('/locations/cities');
    return response.data;
  },

  getByPincode: async (pincode: string): Promise<ApiResponse<LocationData>> => {
    const response = await api.get<ApiResponse<LocationData>>(`/locations/pincode/${pincode}`);
    return response.data;
  },

  getPlatformSupport: async (city: string, platform: string): Promise<ApiResponse<{ city: string; platform: string; supported: boolean }>> => {
    const response = await api.get<ApiResponse<{ city: string; platform: string; supported: boolean }>>(`/locations/platform-support/${city}/${platform}`);
    return response.data;
  },
};

// Scraping API
export const scrapingApi = {
  trigger: async (data: { platform?: string; city: string; pincode: string; categories?: string[] }): Promise<ApiResponse<any>> => {
    const response = await api.post<ApiResponse<any>>('/scrape/trigger', data);
    return response.data;
  },

  getStatus: async (params?: { platform?: string; city?: string; logId?: string }): Promise<ApiResponse<any>> => {
    const queryString = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    const response = await api.get<ApiResponse<any>>(`/scrape/status${queryString}`);
    return response.data;
  },

  getLogs: async (params?: { platform?: string; city?: string; status?: string; limit?: number; page?: number }): Promise<ApiResponse<any>> => {
    const queryString = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    const response = await api.get<ApiResponse<any>>(`/scrape/logs${queryString}`);
    return response.data;
  },

  getStats: async (params?: { city?: string; platform?: string; days?: number }): Promise<ApiResponse<any>> => {
    const queryString = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    const response = await api.get<ApiResponse<any>>(`/scrape/stats${queryString}`);
    return response.data;
  }
};

// Health API
export const healthApi = {
  check: async (): Promise<HealthStatus> => {
    const response = await api.get<HealthStatus>('/health');
    return response.data;
  },
};

// Error handling utility
export const handleApiError = (error: any): ErrorResponse => {
  if (error.response?.data) {
    return error.response.data as ErrorResponse;
  }
  
  if (error.request) {
    return {
      success: false,
      error: 'Network error. Please check your connection.',
    };
  }
  
  return {
    success: false,
    error: error.message || 'An unexpected error occurred.',
  };
};

// Utility function to format currency
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Utility function to format delivery time
export const formatDeliveryTime = (deliveryTime?: string): string => {
  if (!deliveryTime) return 'Delivery time not available';
  
  // Extract hours and minutes from various formats
  const hourMatch = deliveryTime.match(/(\d+)\s*hour/i);
  const minuteMatch = deliveryTime.match(/(\d+)\s*min/i);
  
  if (hourMatch && minuteMatch) {
    return `${hourMatch[1]}h ${minuteMatch[1]}min`;
  } else if (hourMatch) {
    return `${hourMatch[1]}h`;
  } else if (minuteMatch) {
    return `${minuteMatch[1]}min`;
  }
  
  return deliveryTime;
};

// Platform configuration
export type PlatformName = 'blinkit' | 'zepto' | 'instamart' | 'bigbasket';

const platformConfig = {
  blinkit: {
    name: 'Blinkit',
    color: '#FF6B35',
    logo: '/platforms/blinkit.png',
  },
  zepto: {
    name: 'Zepto',
    color: '#8B5CF6',
    logo: '/platforms/zepto.png',
  },
  instamart: {
    name: 'Instamart',
    color: '#3B82F6',
    logo: '/platforms/instamart.png',
  },
  bigbasket: {
    name: 'BigBasket',
    color: '#10B981',
    logo: '/platforms/bigbasket.png',
  },
} as const;

export const PLATFORM_CONFIG: Record<PlatformName, { name: string; color: string; logo: string }> = platformConfig;
