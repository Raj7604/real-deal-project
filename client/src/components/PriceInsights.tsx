import React, { useState, useEffect } from 'react';
import { PriceInsight } from '../types/intelligence';
import { intelligenceApi, formatInsightDescription, getInsightIcon, getConfidenceColor, getConfidenceLabel } from '../services/intelligenceApi';
import { XMarkIcon, InformationCircleIcon, ArrowTrendingUpIcon, ClockIcon, BuildingStorefrontIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

interface PriceInsightsProps {
  productId: string;
  location: {
    city: string;
    pincode: string;
  };
  className?: string;
}

const PriceInsights: React.FC<PriceInsightsProps> = ({ productId, location, className = '' }) => {
  const [insights, setInsights] = useState<PriceInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInsights();
  }, [productId, location]);

  const loadInsights = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await intelligenceApi.getInsights(productId, location.city, location.pincode);
      if (response.success) {
        setInsights(response.data);
      } else {
        setError('Failed to load insights');
      }
    } catch (error) {
      console.error('Error loading insights:', error);
      setError('Failed to load insights');
    } finally {
      setLoading(false);
    }
  };

  const getInsightTypeIcon = (insightType: string) => {
    switch (insightType) {
      case 'price_trend':
        return <ArrowTrendingUpIcon className="h-5 w-5" />;
      case 'best_time_to_buy':
        return <ClockIcon className="h-5 w-5" />;
      case 'platform_preference':
        return <BuildingStorefrontIcon className="h-5 w-5" />;
      case 'savings_opportunity':
        return <CurrencyDollarIcon className="h-5 w-5" />;
      default:
        return <InformationCircleIcon className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center space-x-3 mb-4">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
          <h3 className="text-lg font-semibold text-gray-900">Price Insights</h3>
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
          <InformationCircleIcon className="h-5 w-5 text-red-500" />
          <h3 className="text-lg font-semibold text-gray-900">Price Insights</h3>
        </div>
        <div className="text-red-600 text-center py-4">
          {error}
        </div>
      </div>
    );
  }

  if (insights.length === 0) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center space-x-3 mb-4">
          <InformationCircleIcon className="h-5 w-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900">Price Insights</h3>
        </div>
        <div className="text-gray-500 text-center py-8">
          <InformationCircleIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>Not enough data available to generate insights for this product.</p>
          <p className="text-sm mt-2">Insights will appear as more price history is collected.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <InformationCircleIcon className="h-5 w-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">Price Insights</h3>
        </div>
        <div className="text-xs text-gray-500">
          Based on {insights.reduce((sum, insight) => sum + (insight.metadata?.dataPoints || 0), 0)} data points
        </div>
      </div>

      <div className="space-y-4">
        {insights.map((insight, index) => (
          <div
            key={insight._id}
            className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-sm transition-all duration-200"
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                {getInsightTypeIcon(insight.insightType)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{insight.title}</h4>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-xs font-medium ${getConfidenceColor(insight.confidence)}`}
                    >
                      {getConfidenceLabel(insight.confidence)} Confidence
                    </span>
                    <div className="w-2 h-2 rounded-full" style={{ 
                      backgroundColor: insight.confidence >= 0.8 ? '#10B981' : 
                                       insight.confidence >= 0.6 ? '#F59E0B' : '#EF4444' 
                    }}></div>
                  </div>
                </div>
                
                <p className="text-gray-700 text-sm leading-relaxed">
                  {formatInsightDescription(insight)}
                </p>

                {/* Additional details based on insight type */}
                {insight.insightType === 'price_trend' && insight.data.trend && (
                  <div className="mt-3 p-3 bg-white rounded border border-gray-200">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Direction</span>
                        <span className={`font-medium ${
                          insight.data.trend.direction === 'up' ? 'text-red-600' :
                          insight.data.trend.direction === 'down' ? 'text-green-600' : 'text-gray-600'
                        }`}>
                          {insight.data.trend.direction === 'up' ? '↑ Increasing' :
                           insight.data.trend.direction === 'down' ? '↓ Decreasing' : '→ Stable'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Period</span>
                        <span className="font-medium text-gray-900">{insight.data.trend.period}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Change</span>
                        <span className={`font-medium ${
                          insight.data.trend.direction === 'up' ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {insight.data.trend.direction === 'up' ? '+' : ''}{insight.data.trend.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {insight.insightType === 'platform_preference' && insight.data.platform && (
                  <div className="mt-3 p-3 bg-white rounded border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-gray-500 text-sm">Platform Advantage</span>
                        <span className="font-medium text-gray-900 capitalize">{insight.data.platform.advantage}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-bold text-primary-600">{insight.data.platform.percentage}%</span>
                      </div>
                    </div>
                  </div>
                )}

                {insight.insightType === 'best_time_to_buy' && insight.data.timing && (
                  <div className="mt-3 p-3 bg-green-50 rounded border border-green-200">
                    <div className="flex items-center space-x-2">
                      <ClockIcon className="h-5 w-5 text-green-600" />
                      <span className="text-green-800 font-medium">
                        Best savings: ₹{insight.data.timing.averageSavings}
                      </span>
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
          <InformationCircleIcon className="h-4 w-4 mt-0.5" />
          <p>
            Insights are generated using AI algorithms and historical data. 
            Accuracy improves as more data becomes available.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PriceInsights;
