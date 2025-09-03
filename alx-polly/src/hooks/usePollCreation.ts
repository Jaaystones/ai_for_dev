import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PollService } from '@/services/pollService';
import { ApiError } from '@/types/api';
import { CreatePollInput } from '@/lib/validations/poll';
import { Database } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';

// Type alias for convenience
type Poll = Database['public']['Tables']['polls']['Row'] & {
  poll_options: Database['public']['Tables']['poll_options']['Row'][];
};

export function usePollCreation() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  const createPoll = async (pollData: CreatePollInput): Promise<Poll> => {
    if (!user) {
      const errorMessage = "You must be logged in to create a poll";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await PollService.createPoll(pollData);
      
      // Navigate to polls page on success
      router.push('/polls');
      
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : err instanceof Error 
        ? err.message 
        : 'An unexpected error occurred';
      
      setError(errorMessage);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearError = () => setError(null);

  return { 
    createPoll, 
    isSubmitting, 
    error, 
    clearError,
    canCreatePoll: !!user 
  };
}
