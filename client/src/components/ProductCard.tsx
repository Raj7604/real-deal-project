import React from 'react';
import { Product, PlatformName } from '../types';
import { formatCurrency, formatDeliveryTime, PLATFORM_CONFIG } from '../services/api';
import moment from 'moment';

interface ProductCardProps {
  product: Product;
  onCompare?: (productId: string) => void;
  onProductClick?: (product: Product, platform: string) => void;
  onPlatformClick?: (platform: string, productId: string, price: number) => void;
  className?: string;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onCompare, className = '' }) => {
  const cheapestPlatform = product.cheapestPrice;
  const savings = product.maxSavings;

  const getPlatformColor = (platform: PlatformName) => PLATFORM_CONFIG[platform].color;
  const getPlatformName = (platform: PlatformName) => PLATFORM_CONFIG[platform].name;

  return (
    <div className={`flex flex-col bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden transform transition-all duration-300 hover:-translate-y-1 ${className}`}>
      {/* 1. Header & Image Stack */}
      <div className="relative h-48 w-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center overflow-hidden shrink-0">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="h-full object-contain mix-blend-multiply dark:mix-blend-normal transform transition-transform duration-500 hover:scale-110"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder-product.png';
            }}
          />
        ) : (
          <svg className="w-12 h-12 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )}
        
        {/* Dynamic Freshness Timestamp */}
        {product.platforms[0]?.lastUpdated && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded text-[10px] font-medium text-gray-500 dark:text-gray-400 capitalize border border-gray-200 dark:border-gray-700">
            Updated {moment(product.platforms[0].lastUpdated).fromNow()}
          </div>
        )}
      </div>

      {/* 2. Content Info */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex-1 min-w-0 mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 line-clamp-2 leading-tight tracking-tight">
            {product.name}
          </h3>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1 capitalize">
            {product.quantity} {product.unit} • {product.brand}
          </p>
        </div>

        {/* Savings Badge */}
        {savings > 0 && cheapestPlatform && (
          <div className="mb-4 inline-flex items-center px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800/50 w-fit">
            <span className="text-green-700 dark:text-green-400 font-semibold text-sm">
              Save {formatCurrency(savings)} on {getPlatformName(cheapestPlatform.platform as PlatformName)}
            </span>
          </div>
        )}

        {/* 3. Platform Scroller */}
        <div className="space-y-2 mt-auto">
          {product.platforms
            .filter(platform => platform.availability)
            .sort((a, b) => a.price - b.price)
            .slice(0, 3) // Show max 3 natively
            .map((platform) => {
              const isCheapest = cheapestPlatform?.platform === platform.platform;
              return (
                <div
                  key={platform.platform}
                  className={`flex justify-between items-center py-2 px-3 rounded-lg border ${
                    isCheapest 
                      ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800/50' 
                      : 'bg-transparent border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  } transition-colors`}
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: getPlatformColor(platform.platform as PlatformName) }} />
                    <span className={`text-sm font-bold ${isCheapest ? 'text-primary-800 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'}`}>
                      {getPlatformName(platform.platform as PlatformName)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="block font-bold text-gray-900 dark:text-gray-100">{formatCurrency(platform.price)}</span>
                    {platform.deliveryTime && (
                      <span className="block text-[11px] font-medium text-gray-400 dark:text-gray-500">
                        {formatDeliveryTime(platform.deliveryTime)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
