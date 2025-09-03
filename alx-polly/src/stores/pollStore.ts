import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { PollService } from '@/services/pollService';
import { Poll, ApiError } from '@/types/api';
import { CreatePollInput } from '@/lib/validations/poll';

interface PollStore {
  // State
  polls: Poll[];
  currentPoll: Poll | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  setPolls: (polls: Poll[]) => void;
  setCurrentPoll: (poll: Poll | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Async Actions
  fetchPolls: () => Promise<void>;
  fetchPoll: (id: string) => Promise<void>;
  createPoll: (data: CreatePollInput) => Promise<Poll>;
  votePoll: (pollId: string, optionId: string) => Promise<void>;
  
  // Computed/Derived State
  getActivePollsCount: () => number;
  getPollById: (id: string) => Poll | undefined;
  hasError: () => boolean;
}

export const usePollStore = create<PollStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      polls: [],
      currentPoll: null,
      loading: false,
      error: null,

      // Basic setters
      setPolls: (polls) => set({ polls }, false, 'setPolls'),
      setCurrentPoll: (poll) => set({ currentPoll: poll }, false, 'setCurrentPoll'),
      setLoading: (loading) => set({ loading }, false, 'setLoading'),
      setError: (error) => set({ error }, false, 'setError'),
      clearError: () => set({ error: null }, false, 'clearError'),

      // Async actions
      fetchPolls: async () => {
        set({ loading: true, error: null }, false, 'fetchPolls:start');
        try {
          const response = await PollService.getPolls();
          set({ 
            polls: response.data, 
            loading: false 
          }, false, 'fetchPolls:success');
        } catch (error) {
          const errorMessage = error instanceof ApiError 
            ? error.message 
            : error instanceof Error 
            ? error.message 
            : 'Failed to fetch polls';
          
          set({ 
            error: errorMessage, 
            loading: false 
          }, false, 'fetchPolls:error');
        }
      },

      fetchPoll: async (id: string) => {
        set({ loading: true, error: null }, false, 'fetchPoll:start');
        try {
          const response = await PollService.getPoll(id);
          set({ 
            currentPoll: response.data, 
            loading: false 
          }, false, 'fetchPoll:success');
        } catch (error) {
          const errorMessage = error instanceof ApiError 
            ? error.message 
            : error instanceof Error 
            ? error.message 
            : 'Failed to fetch poll';
          
          set({ 
            error: errorMessage, 
            loading: false 
          }, false, 'fetchPoll:error');
        }
      },

      createPoll: async (data: CreatePollInput) => {
        set({ loading: true, error: null }, false, 'createPoll:start');
        try {
          const response = await PollService.createPoll(data);
          
          // Add new poll to the beginning of the list
          set(state => ({ 
            polls: [response.data, ...state.polls], 
            loading: false 
          }), false, 'createPoll:success');
          
          return response.data;
        } catch (error) {
          const errorMessage = error instanceof ApiError 
            ? error.message 
            : error instanceof Error 
            ? error.message 
            : 'Failed to create poll';
          
          set({ 
            error: errorMessage, 
            loading: false 
          }, false, 'createPoll:error');
          
          throw error;
        }
      },

      votePoll: async (pollId: string, optionId: string) => {
        try {
          await PollService.votePoll(pollId, optionId);
          
          // Optimistically update the poll in both polls list and currentPoll
          set(state => {
            const updatePoll = (poll: Poll) => {
              if (poll.id === pollId) {
                return {
                  ...poll,
                  poll_options: poll.poll_options.map(option =>
                    option.id === optionId 
                      ? { ...option, vote_count: option.vote_count + 1 }
                      : option
                  ),
                  total_votes: poll.total_votes + 1
                };
              }
              return poll;
            };

            return {
              polls: state.polls.map(updatePoll),
              currentPoll: state.currentPoll ? updatePoll(state.currentPoll) : null
            };
          }, false, 'votePoll:optimistic');
          
        } catch (error) {
          const errorMessage = error instanceof ApiError 
            ? error.message 
            : error instanceof Error 
            ? error.message 
            : 'Failed to vote';
          
          set({ error: errorMessage }, false, 'votePoll:error');
          throw error;
        }
      },

      // Computed state
      getActivePollsCount: () => {
        const { polls } = get();
        return polls.filter(poll => poll.is_active).length;
      },

      getPollById: (id: string) => {
        const { polls } = get();
        return polls.find(poll => poll.id === id);
      },

      hasError: () => {
        const { error } = get();
        return !!error;
      },
    }),
    {
      name: 'poll-store', // unique name for devtools
    }
  )
);

// Selectors for performance optimization
export const usePolls = () => usePollStore(state => state.polls);
export const useCurrentPoll = () => usePollStore(state => state.currentPoll);
export const usePollLoading = () => usePollStore(state => state.loading);
export const usePollError = () => usePollStore(state => state.error);

// Action selectors
export const usePollActions = () => usePollStore(state => ({
  fetchPolls: state.fetchPolls,
  fetchPoll: state.fetchPoll,
  createPoll: state.createPoll,
  votePoll: state.votePoll,
  clearError: state.clearError,
  setCurrentPoll: state.setCurrentPoll,
}));
