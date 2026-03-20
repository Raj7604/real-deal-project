import { useCallback, useEffect } from 'react';
import { useLocation } from '../contexts/LocationContext';
import { intelligenceApi } from '../services/intelligenceApi';

export const useUserTracking = (sessionId: string) => {
  const { state: locationState } = useLocation();

  const trackEvent = useCallback(async (eventType: string, data: any) => {
    try {
      await intelligenceApi.trackEvent(
        sessionId,
        locationState.currentLocation.city,
        locationState.currentLocation.pincode,
        eventType,
        data
      );
    } catch (error) {
      console.error('Error tracking user event:', error);
    }
  }, [sessionId, locationState.currentLocation]);

  const trackSearch = useCallback(async (query: string, resultCount: number) => {
    await trackEvent('search', {
      query,
      resultCount
    });
  }, [trackEvent]);

  const trackProductView = useCallback(async (productId: string, productName: string, platform?: string) => {
    await trackEvent('product_view', {
      productId,
      productName,
      platform
    });
  }, [trackEvent]);

  const trackComparison = useCallback(async (productId: string, platforms: string[]) => {
    await trackEvent('comparison', {
      productId,
      platforms
    });
  }, [trackEvent]);

  const trackPlatformClick = useCallback(async (platform: string, productId: string, price: number, converted: boolean = false) => {
    await trackEvent('platform_click', {
      platform,
      productId,
      price,
      converted
    });
  }, [trackEvent]);

  const trackFilterChange = useCallback(async (filters: any) => {
    await trackEvent('filter_change', {
      filters
    });
  }, [trackEvent]);

  const trackSortChange = useCallback(async (sortBy: string) => {
    await trackEvent('sort_change', {
      sortBy
    });
  }, [trackEvent]);

  // Auto-track page view
  useEffect(() => {
    const trackPageView = () => {
      trackEvent('product_view', {
        page: window.location.pathname,
        timestamp: new Date().toISOString()
      });
    };

    // Track after a short delay to ensure page is loaded
    const timer = setTimeout(trackPageView, 1000);
    
    return () => clearTimeout(timer);
  }, [trackEvent]);

  return {
    trackSearch,
    trackProductView,
    trackComparison,
    trackPlatformClick,
    trackFilterChange,
    trackSortChange
  };
};
