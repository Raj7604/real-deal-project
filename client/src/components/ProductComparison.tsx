import React from 'react';
import { ProductComparison as ProductComparisonType, PlatformName } from '../types';
import { formatCurrency, formatDeliveryTime, PLATFORM_CONFIG } from '../services/api';
import { XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';

interface ProductComparisonProps {
  comparison: ProductComparisonType;
  onClose: () => void;
}

const ProductComparison: React.FC<ProductComparisonProps> = ({ comparison, onClose }) => {
  const getPlatformColor = (platform: PlatformName) => {
    return PLATFORM_CONFIG[platform].color;
  };

  const getPlatformName = (platform: PlatformName) => {
    return PLATFORM_CONFIG[platform].name;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {comparison.product.name}
            </h2>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span className="capitalize">{comparison.product.brand}</span>
              <span>•</span>
              <span>{comparison.product.quantity} {comparison.product.unit}</span>
              <span>•</span>
              <span className="capitalize">{comparison.product.category}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close comparison"
          >
            <XMarkIcon className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        {/* Product Image */}
        {comparison.product.image && (
          <div className="p-6 pb-0">
            <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={comparison.product.image}
                alt={comparison.product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder-product.png';
                }}
              />
            </div>
          </div>
        )}

        {/* Savings Summary */}
        {comparison.maxSavings > 0 && (
          <div className="px-6 py-4 bg-green-50 border-b border-green-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <CheckCircleIconSolid className="h-6 w-6 text-green-600" />
                  <span className="text-green-800 font-semibold text-lg">
                    Maximum Savings: {formatCurrency(comparison.maxSavings)}
                  </span>
                </div>
                <span className="text-green-600">
                  ({((comparison.maxSavings / comparison.priceRange.max) * 100).toFixed(1)}%)
                </span>
              </div>
              <div className="text-green-700 text-sm">
                Price Range: {formatCurrency(comparison.priceRange.min)} - {formatCurrency(comparison.priceRange.max)}
              </div>
            </div>
          </div>
        )}

        {/* Platform Comparison Table */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Price Comparison</h3>
          <div className="space-y-3">
            {comparison.platforms.map((platform) => (
              <div
                key={platform.platform}
                className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all duration-200 ${
                  platform.isCheapest
                    ? 'bg-green-50 border-green-400'
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center space-x-4">
                  {/* Platform Info */}
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: getPlatformColor(platform.platform as PlatformName) }}
                    />
                    <div>
                      <div className="font-semibold text-gray-900">
                        {getPlatformName(platform.platform as PlatformName)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {platform.originalName}
                      </div>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center space-x-2">
                    {platform.isCheapest && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        Best Deal
                      </span>
                    )}
                    <span className="text-sm text-gray-600">
                      Rank #{platform.rank}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(platform.price)}
                  </div>
                  {platform.deliveryTime && (
                    <div className="text-sm text-gray-600">
                      {formatDeliveryTime(platform.deliveryTime)}
                    </div>
                  )}
                  {platform.savings > 0 && (
                    <div className="text-sm text-red-600 font-medium">
                      +{formatCurrency(platform.savings)} vs best
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6">
          <div className="flex space-x-3">
            {comparison.platforms
              .filter(p => p.isCheapest)
              .map(platform => (
                <a
                  key={platform.platform}
                  href={platform.productUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 btn-primary text-center"
                >
                  Buy on {getPlatformName(platform.platform as PlatformName)} - {formatCurrency(platform.price)}
                </a>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductComparison;
