import { useState, useEffect } from 'react';
import { PollService } from '@/services/pollService';
import { ApiError, Poll } from '@/types/api';

interface UsePollsOptions {
  autoFetch?: boolean;
}

export function usePolls(options: UsePollsOptions = { autoFetch: true }) {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPolls = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await PollService.getPolls();
      setPolls(response.data);
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : err instanceof Error 
        ? err.message 
        : 'Failed to fetch polls';
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => fetchPolls();
  const clearError = () => setError(null);

  useEffect(() => {
    if (options.autoFetch) {
      fetchPolls();
    }
  }, [options.autoFetch]);

  return {
    polls,
    loading,
    error,
    refetch,
    clearError
  };
}
