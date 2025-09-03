'use client';

import { useState, useCallback } from 'react';
import { PollService } from '@/services/pollService';
import { useAuth } from '@/contexts/AuthContext';
import { usePollStore } from '@/stores/pollStore';
import { PollType, MultipleChoiceVote, RankingVote, RatingVote } from '@/types/pollTypes';
import { 
  SingleChoiceVoteSchema, 
  MultipleChoiceVoteSchema, 
  RankingVoteSchema, 
  RatingVoteSchema 
} from '@/lib/validations/poll';

export function useAdvancedVoting() {
  const [isVoting, setIsVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { votePoll: updateStoreVote } = usePollStore();

  const vote = useCallback(async (pollId: string, voteData: any, pollType: PollType) => {
    setIsVoting(true);
    setError(null);

    try {
      let validatedData;
      
      // Validate based on poll type
      switch (pollType) {
        case PollType.SINGLE_CHOICE:
          validatedData = SingleChoiceVoteSchema.parse(voteData);
          break;
        case PollType.MULTIPLE_CHOICE:
          validatedData = MultipleChoiceVoteSchema.parse(voteData);
          break;
        case PollType.RANKING:
          validatedData = RankingVoteSchema.parse(voteData);
          break;
        case PollType.RATING:
          validatedData = RatingVoteSchema.parse(voteData);
          break;
        default:
          throw new Error('Unsupported poll type');
      }

      // Submit vote through service
      const result = await PollService.submitAdvancedVote(validatedData, pollType);
      
      // Update optimistic state for single choice
      if (pollType === PollType.SINGLE_CHOICE && 'optionId' in validatedData) {
        await updateStoreVote(pollId, validatedData.optionId);
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit vote';
      setError(errorMessage);
      throw err;
    } finally {
      setIsVoting(false);
    }
  }, [user, updateStoreVote]);

  const voteSingleChoice = useCallback(async (pollId: string, optionId: string, reason?: string) => {
    return vote(pollId, { pollId, optionId, reason }, PollType.SINGLE_CHOICE);
  }, [vote]);

  const voteMultipleChoice = useCallback(async (
    pollId: string, 
    optionIds: string[], 
    otherText?: string, 
    reason?: string
  ) => {
    return vote(pollId, { pollId, optionIds, otherText, reason }, PollType.MULTIPLE_CHOICE);
  }, [vote]);

  const voteRanking = useCallback(async (
    pollId: string, 
    rankings: Array<{ optionId: string; rank: number }>, 
    reason?: string
  ) => {
    return vote(pollId, { pollId, rankings, reason }, PollType.RANKING);
  }, [vote]);

  const voteRating = useCallback(async (
    pollId: string, 
    ratings: Array<{ optionId: string; rating: number }>, 
    reason?: string
  ) => {
    return vote(pollId, { pollId, ratings, reason }, PollType.RATING);
  }, [vote]);

  const clearError = useCallback(() => setError(null), []);

  return {
    isVoting,
    error,
    voteSingleChoice,
    voteMultipleChoice,
    voteRanking,
    voteRating,
    clearError,
  };
}
