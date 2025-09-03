import { useEffect, useCallback, useRef } from 'react';
import { analytics } from '@/lib/analytics';
import config from '@/lib/config';

interface PerformanceMetrics {
  renderTime?: number;
  interactionTime?: number;
  apiResponseTime?: number;
  memoryUsage?: number;
}

export function usePerformanceMonitor(componentName: string) {
  const renderStartTime = useRef<number>(Date.now());
  const lastInteractionTime = useRef<number>(0);
  const apiCallStartTimes = useRef<Map<string, number>>(new Map());

  // Track component render time
  useEffect(() => {
    const renderTime = Date.now() - renderStartTime.current;
    analytics.trackPerformance(`${componentName}_render_time`, renderTime);
    
    // Track memory usage (if available)
    if ('memory' in performance) {
      const memoryInfo = (performance as any).memory;
      analytics.trackPerformance(`${componentName}_memory_usage`, memoryInfo.usedJSHeapSize, 'bytes');
    }
  }, [componentName]);

  // Track user interactions
  const trackInteraction = useCallback((interactionType: string) => {
    const now = Date.now();
    const timeSinceLastInteraction = now - lastInteractionTime.current;
    
    if (lastInteractionTime.current > 0) {
      analytics.trackPerformance(`${componentName}_interaction_gap`, timeSinceLastInteraction);
    }
    
    lastInteractionTime.current = now;
    analytics.trackInteraction(componentName, interactionType);
  }, [componentName]);

  // Track API call performance
  const trackApiCallStart = useCallback((apiEndpoint: string) => {
    apiCallStartTimes.current.set(apiEndpoint, Date.now());
  }, []);

  const trackApiCallEnd = useCallback((apiEndpoint: string, success: boolean = true) => {
    const startTime = apiCallStartTimes.current.get(apiEndpoint);
    if (startTime) {
      const responseTime = Date.now() - startTime;
      analytics.trackPerformance(`${componentName}_api_${apiEndpoint.replace('/', '_')}_time`, responseTime);
      apiCallStartTimes.current.delete(apiEndpoint);
      
      if (!success) {
        analytics.trackError(new Error(`API call failed: ${apiEndpoint}`), componentName);
      }
    }
  }, [componentName]);

  // Track Core Web Vitals
  const trackWebVitals = useCallback(() => {
    if (typeof window === 'undefined') return;

    // Largest Contentful Paint (LCP)
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        analytics.trackPerformance('lcp', entry.startTime);
      }
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay (FID)
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        analytics.trackPerformance('fid', (entry as any).processingStart - entry.startTime);
      }
    }).observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift (CLS)
    new PerformanceObserver((list) => {
      let clsValue = 0;
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
      analytics.trackPerformance('cls', clsValue);
    }).observe({ entryTypes: ['layout-shift'] });
  }, []);

  // Initialize web vitals tracking
  useEffect(() => {
    if (config.features.analyticsEnabled) {
      trackWebVitals();
    }
  }, [trackWebVitals]);

  return {
    trackInteraction,
    trackApiCallStart,
    trackApiCallEnd,
    trackWebVitals,
  };
}

// Hook for monitoring specific operations
export function useOperationTimer(operationName: string) {
  const startTimeRef = useRef<number>(0);

  const startTimer = useCallback(() => {
    startTimeRef.current = performance.now();
  }, []);

  const endTimer = useCallback(() => {
    if (startTimeRef.current > 0) {
      const duration = performance.now() - startTimeRef.current;
      analytics.trackPerformance(operationName, duration);
      startTimeRef.current = 0;
      return duration;
    }
    return 0;
  }, [operationName]);

  return { startTimer, endTimer };
}

// Hook for monitoring API calls with automatic timing
export function useApiMonitor() {
  const trackApiCall = useCallback(async <T>(
    apiCall: () => Promise<T>,
    endpoint: string
  ): Promise<T> => {
    const startTime = performance.now();
    
    try {
      const result = await apiCall();
      const duration = performance.now() - startTime;
      analytics.trackPerformance(`api_${endpoint.replace('/', '_')}_success`, duration);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      analytics.trackPerformance(`api_${endpoint.replace('/', '_')}_error`, duration);
      analytics.trackError(error instanceof Error ? error : new Error(String(error)), endpoint);
      throw error;
    }
  }, []);

  return { trackApiCall };
}
