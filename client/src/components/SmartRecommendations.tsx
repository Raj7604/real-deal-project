import React, { useState, useEffect, useCallback } from 'react';
import { PersonalizedRecommendation } from '../types/intelligence';
import { intelligenceApi } from '../services/intelligenceApi';
import { LightBulbIcon } from '@heroicons/react/24/outline';

interface SmartRecommendationsProps {
  sessionId: string;
  location: {
    city: string;
    pincode: string;
  };
  className?: string;
}

const SmartRecommendations: React.FC<SmartRecommendationsProps> = ({ 
  sessionId, 
  location, 
  className = '' 
}) => {
  const [recommendations, setRecommendations] = useState<PersonalizedRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRecommendations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await intelligenceApi.getRecommendations(sessionId, location.city, location.pincode, 5);
      if (response.success) {
        setRecommendations(response.data);
      } else {
        setError('Failed to load recommendations');
      }
    } catch (error) {
      console.error('Error loading recommendations:', error);
      setError('Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  }, [sessionId, location.city, location.pincode]);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'based_on_history':
        return '🔍';
      case 'platform_preference':
        return '🏪';
      case 'price_drop':
        return '📉';
      case 'category_trend':
        return '📈';
      default:
        return '💡';
    }
  };

  const getRecommendationColor = (type: string) => {
    switch (type) {
      case 'based_on_history':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'platform_preference':
        return 'bg-purple-50 border-purple-200 text-purple-800';
      case 'price_drop':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'category_trend':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center space-x-3 mb-4">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
          <h3 className="text-lg font-semibold text-gray-900">Smart Recommendations</h3>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg">
              <div className="skeleton-text w-3/4"></div>
              <div className="skeleton-text"></div>
              <div className="skeleton-text w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center space-x-3 mb-4">
          <LightBulbIcon className="h-5 w-5 text-red-500" />
          <h3 className="text-lg font-semibold text-gray-900">Smart Recommendations</h3>
        </div>
        <div className="text-red-600 text-center py-4">
          {error}
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center space-x-3 mb-4">
          <LightBulbIcon className="h-5 w-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900">Smart Recommendations</h3>
        </div>
        <div className="text-gray-500 text-center py-8">
          <LightBulbIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>No recommendations available yet.</p>
          <p className="text-sm mt-2">Start searching and comparing products to get personalized suggestions!</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <LightBulbIcon className="h-5 w-5 text-yellow-500" />
          <h3 className="text-lg font-semibold text-gray-900">Smart Recommendations</h3>
        </div>
        <div className="text-xs text-gray-500">
          Powered by AI
        </div>
      </div>

      <div className="space-y-3">
        {recommendations.map((recommendation, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-sm ${getRecommendationColor(recommendation.type)}`}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 text-2xl mt-1">
                {getRecommendationIcon(recommendation.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{recommendation.title}</h4>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-medium bg-gray-100 text-gray-700 px-2 py-1 rounded">
                      {Math.round(recommendation.confidence * 100)}% match
                    </span>
                  </div>
                </div>
                
                {recommendation.description && (
                  <p className="text-gray-700 text-sm leading-relaxed mb-3">
                    {recommendation.description}
                  </p>
                )}

                {/* Show product suggestions for history-based recommendations */}
                {recommendation.type === 'based_on_history' && recommendation.products && recommendation.products.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Suggested Products</span>
                    <div className="grid grid-cols-1 gap-2">
                      {recommendation.products.slice(0, 3).map((product, productIndex) => (
                        <div key={productIndex} className="flex items-center space-x-2 p-2 bg-white rounded border border-gray-200">
                          <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                            <LightBulbIcon className="h-4 w-4 text-gray-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {typeof product === 'string' ? product : product.name || 'Unknown Product'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action button for platform preferences */}
                {recommendation.type === 'platform_preference' && (
                  <div className="mt-3">
                    <button className="w-full btn-primary text-sm">
                      Explore {recommendation.title}
                    </button>
                  </div>
                )}

                {/* Special offer indicator */}
                {recommendation.type === 'price_drop' && (
                  <div className="mt-3 p-2 bg-red-50 rounded border border-red-200">
                    <div className="flex items-center space-x-2">
                      <span className="text-red-800 font-medium text-sm">🔥 Limited Time Offer</span>
                      <span className="text-red-600 text-xs">Prices recently dropped!</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer note */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-start space-x-2 text-xs text-gray-500">
          <LightBulbIcon className="h-4 w-4 mt-0.5" />
          <p>
            Recommendations are personalized based on your search history and preferences.
            The more you search, the better these recommendations will become.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SmartRecommendations;
