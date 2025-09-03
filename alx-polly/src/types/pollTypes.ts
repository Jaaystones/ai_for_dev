import type { Poll, PollOption } from './poll';

export enum PollType {
  SINGLE_CHOICE = 'single_choice',
  MULTIPLE_CHOICE = 'multiple_choice',
  RANKING = 'ranking',
  RATING = 'rating',
  TEXT_INPUT = 'text_input'
}

export enum PollCategory {
  PROGRAMMING = 'programming',
  GENERAL = 'general',
  SURVEY = 'survey',
  FEEDBACK = 'feedback',
  DECISION = 'decision',
  OPINION = 'opinion'
}

export interface PollSettings {
  pollType: PollType;
  category: PollCategory;
  maxSelections?: number; // For multiple choice
  minSelections?: number; // For multiple choice and ranking
  allowOtherOption?: boolean;
  allowOther?: boolean; // Alternative name for allowOtherOption
  randomizeOptions?: boolean;
  showResults?: 'always' | 'after_voting' | 'after_expiry';
  allowComments?: boolean;
  requireReason?: boolean; // For voting
  requireAllRatings?: boolean; // For rating polls
  maxRating?: number; // For rating polls
  minRating?: number; // For rating polls
  scaleType?: 'stars' | 'numbers' | 'thumbs' | 'hearts'; // For rating polls
}

export interface PollAnalytics {
  totalVotes: number;
  uniqueVoters: number;
  completionRate: number;
  engagementRate?: number;
  averageTimeToVote: number;
  averageResponseTime?: number;
  votingPattern: 'steady' | 'burst' | 'declining';
  peakVotingTime: string;
  peakVotingHour?: string;
  votingTimeline?: Array<{
    timestamp: string;
    cumulativeVotes: number;
    newVotes: number;
  }>;
  deviceBreakdown: {
    mobile: number;
    desktop: number;
    tablet: number;
  };
  geographicDistribution?: Record<string, number>;
  locationData?: {
    country: string;
    count: number;
  }[];
  referralSources?: {
    source: string;
    count: number;
  }[];
  rankingAnalytics?: {
    averageRankings?: Array<{
      option: string;
      averageRank: number;
    }>;
    consensusScore: number;
  };
  ratingAnalytics?: {
    averageRatings?: Array<{
      option: string;
      averageRating: number;
      standardDeviation: number;
    }>;
  };
}

export interface EnhancedPoll extends Poll {
  settings: PollSettings;
  analytics?: PollAnalytics;
  comments?: PollComment[];
}

export interface PollComment {
  id: string;
  poll_id: string;
  user_id?: string;
  content: string;
  created_at: string;
  is_anonymous: boolean;
}

export interface RankingVote {
  option_id: string;
  rank: number;
}

export interface RatingVote {
  option_id: string;
  rating: number; // 1-5 or 1-10
}

export interface MultipleChoiceVote {
  option_ids: string[];
  other_text?: string;
  reason?: string;
}

// Re-export from existing poll types
export type { Poll, PollOption } from './poll';
