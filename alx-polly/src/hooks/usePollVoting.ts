import { useState } from 'react';
import { PollService } from '@/services/pollService';
import { ApiError } from '@/types/api';

export function usePollVoting() {
  const [isVoting, setIsVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const vote = async (pollId: string, optionId: string) => {
    setIsVoting(true);
    setError(null);
    
    try {
      const response = await PollService.votePoll(pollId, optionId);
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : err instanceof Error 
        ? err.message 
        : 'Failed to vote';
      
      setError(errorMessage);
      throw err;
    } finally {
      setIsVoting(false);
    }
  };

  const clearError = () => setError(null);

  return {
    vote,
    isVoting,
    error,
    clearError
  };
}
