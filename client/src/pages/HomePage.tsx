import React, { useState, useEffect } from 'react';
import { Product, SearchFilters } from '../types';
import { productApi } from '../services/api';
import { useLocation } from '../contexts/LocationContext';
import { useUserTracking } from '../hooks/useUserTracking';
import SearchBar from '../components/SearchBar';
import ProductCard from '../components/ProductCard';
import ProductComparison from '../components/ProductComparison';
import PriceInsights from '../components/PriceInsights';
import SmartRecommendations from '../components/SmartRecommendations';
import { FunnelIcon, AdjustmentsHorizontalIcon, ArrowPathIcon, ChartBarIcon, LightBulbIcon } from '@heroicons/react/24/outline';

const HomePage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [filters, setFilters] = useState<SearchFilters>({
    sortBy: 'relevance',
    limit: 20,
  });
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);

  const { state: locationState } = useLocation();
  const { trackSearch, trackProductView, trackComparison, trackPlatformClick, trackFilterChange, trackSortChange } = useUserTracking('session_' + Date.now());

  // Load initial data
  useEffect(() => {
    loadPopularProducts();
    loadCategories();
    loadBrands();
  }, [locationState.currentLocation.city]);

  const loadPopularProducts = async () => {
    try {
      setLoading(true);
      const response = await productApi.getPopular(locationState.currentLocation.city, 10);
      if (response.success) {
        setProducts(response.data);
      }
    } catch (error) {
      console.error('Error loading popular products:', error);
      setError('Failed to load popular products');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await productApi.getCategories(locationState.currentLocation.city);
      if (response.success) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadBrands = async () => {
    try {
      const response = await productApi.getBrands(locationState.currentLocation.city);
      if (response.success) {
        setBrands(response.data);
      }
    } catch (error) {
      console.error('Error loading brands:', error);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;

    try {
      setLoading(true);
      setError(null);
      setSearchQuery(query);

      const searchFilters = {
        ...filters,
        city: locationState.currentLocation.city,
      };

      const response = await productApi.search(query, locationState.currentLocation.city, searchFilters);
      if (response.success) {
        setProducts(response.data);
        await trackSearch(query, response.data.length);
      } else {
        setError(response.error || 'Search failed');
      }
    } catch (error) {
      console.error('Search error:', error);
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: Partial<SearchFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    
    if (searchQuery) {
      handleSearch(searchQuery);
    } else {
      loadPopularProducts();
    }
  };

  const handleCompare = (productId: string) => {
    setSelectedProduct(productId);
  };

  const handleCloseComparison = () => {
    setSelectedProduct(null);
  };

  const refreshData = () => {
    if (searchQuery) {
      handleSearch(searchQuery);
    } else {
      loadPopularProducts();
    }
  };

  const selectedProductData = products.find(p => p._id === selectedProduct);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-3xl font-bold text-gray-900">RealDeal</h1>
              <span className="text-gray-600">Smart Grocery Price Comparison</span>
            </div>
            <button
              onClick={refreshData}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={loading}
              aria-label="Refresh data"
            >
              <ArrowPathIcon className={`h-5 w-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Search Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-3xl mx-auto">
          <SearchBar
            onSearch={handleSearch}
            className="mb-6"
          />

          {/* Filters */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4 mb-6">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <AdjustmentsHorizontalIcon className="h-4 w-4" />
                <span>Filters</span>
                {(filters.category || filters.brand || filters.sortBy !== 'relevance') && (
                  <span className="w-2 h-2 bg-primary-600 rounded-full"></span>
                )}
              </button>

              <button
                onClick={() => setShowInsights(!showInsights)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  showInsights 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-white border border-gray-300 hover:bg-gray-50'
                }`}
              >
                <ChartBarIcon className="h-4 w-4" />
                <span>Insights</span>
              </button>

              <button
                onClick={() => setShowRecommendations(!showRecommendations)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  showRecommendations 
                    ? 'bg-yellow-500 text-white' 
                    : 'bg-white border border-gray-300 hover:bg-gray-50'
                }`}
              >
                <LightBulbIcon className="h-4 w-4" />
                <span>AI Tips</span>
              </button>
            </div>

            <div className="text-sm text-gray-600">
              {products.length} products found
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="flex items-center space-x-3 p-4 bg-white border border-gray-200 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={filters.category || ''}
                  onChange={(e) => handleFilterChange({ category: e.target.value || undefined })}
                  className="input-field text-sm"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brand
                </label>
                <select
                  value={filters.brand || ''}
                  onChange={(e) => handleFilterChange({ brand: e.target.value || undefined })}
                  className="input-field text-sm"
                >
                  <option value="">All Brands</option>
                  {brands.map(brand => (
                    <option key={brand} value={brand}>
                      {brand.charAt(0).toUpperCase() + brand.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sort By
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange({ sortBy: e.target.value as SearchFilters['sortBy'] })}
                  className="input-field text-sm"
                >
                  <option value="relevance">Relevance</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                  <option value="newest">Newest First</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Error Message */}
      {error && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        </section>
      )}

      {/* Products Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="card">
                <div className="skeleton-image"></div>
                <div className="skeleton-text"></div>
                <div className="skeleton-text w-3/4"></div>
                <div className="skeleton-text w-1/2"></div>
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                onCompare={handleCompare}
              />
            ))}
          </div>
        ) : !error ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-4">
              {searchQuery ? 'No products found' : 'No popular products available'}
            </div>
            {searchQuery && (
              <button
                onClick={() => handleSearch('')}
                className="btn-secondary"
              >
                Show Popular Products
              </button>
            )}
          </div>
        ) : null}
      </section>

      {/* Product Comparison Modal */}
      {selectedProduct && selectedProductData && (
        <ProductComparison
          comparison={{
            product: {
              id: selectedProductData._id,
              name: selectedProductData.name,
              brand: selectedProductData.brand,
              category: selectedProductData.category,
              quantity: selectedProductData.quantity,
              unit: selectedProductData.unit,
              image: selectedProductData.image,
              location: selectedProductData.location,
            },
            platforms: selectedProductData.platforms
              .filter(p => p.availability)
              .sort((a, b) => a.price - b.price)
              .map((platform, index) => ({
                ...platform,
                isCheapest: index === 0,
                savings: platform.price - selectedProductData.platforms[0].price,
                savingsPercentage: ((platform.price - selectedProductData.platforms[0].price) / platform.price) * 100,
                rank: index + 1,
              })),
            priceRange: selectedProductData.priceRange || { min: 0, max: 0, difference: 0 },
            maxSavings: selectedProductData.maxSavings,
            totalPlatforms: selectedProductData.platforms.filter(p => p.availability).length,
          }}
          onClose={handleCloseComparison}
        />
      )}

      {/* Price Insights Panel */}
      {showInsights && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Price Insights</h2>
                <button
                  onClick={() => setShowInsights(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="h-6 w-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6">
              <PriceInsights
                productId={selectedProduct}
                location={locationState.currentLocation}
              />
            </div>
          </div>
        </div>
      )}

      {/* Smart Recommendations Panel */}
      {showRecommendations && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">AI-Powered Recommendations</h2>
                <button
                  onClick={() => setShowRecommendations(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="h-6 w-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6">
              <SmartRecommendations
                sessionId={'session_' + Date.now()}
                location={locationState.currentLocation}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
