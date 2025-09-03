'use client';

import { useState, useEffect, useCallback } from 'react';
import { PollAnalytics } from '@/types/pollTypes';
import config, { buildApiUrl } from '@/lib/config';

interface UsePollAnalyticsOptions {
  pollId: string;
  refreshInterval?: number;
  enabled?: boolean;
}

export function usePollAnalytics({ 
  pollId, 
  refreshInterval = 30000, 
  enabled = true 
}: UsePollAnalyticsOptions) {
  const [analytics, setAnalytics] = useState<PollAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    if (!enabled || !pollId) return;

    setIsLoading(true);
    setError(null);

    try {
      const url = buildApiUrl(`/polls/${pollId}/analytics`);
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.statusText}`);
      }

      const data = await response.json();
      setAnalytics(data.data || data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch analytics';
      setError(errorMessage);
      console.error('Analytics fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [pollId, enabled]);

  // Initial fetch
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Set up periodic refresh
  useEffect(() => {
    if (!refreshInterval || !enabled) return;

    const interval = setInterval(fetchAnalytics, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchAnalytics, refreshInterval, enabled]);

  const refresh = useCallback(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    analytics,
    isLoading,
    error,
    refresh,
  };
}
