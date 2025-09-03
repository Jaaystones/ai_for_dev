import { useState, useEffect } from 'react';
import { PollService } from '@/services/pollService';
import { ApiError, Poll } from '@/types/api';

export function usePoll(pollId: string | null) {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPoll = async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await PollService.getPoll(id);
      setPoll(response.data);
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : err instanceof Error 
        ? err.message 
        : 'Failed to fetch poll';
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    if (pollId) {
      fetchPoll(pollId);
    }
  };

  const clearError = () => setError(null);

  useEffect(() => {
    if (pollId) {
      fetchPoll(pollId);
    }
  }, [pollId]);

  return {
    poll,
    loading,
    error,
    refetch,
    clearError
  };
}
