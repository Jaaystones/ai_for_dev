import { Database } from './database';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export class ApiError extends Error {
  constructor(public message: string, public status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface VoteResult {
  success: boolean;
  poll: Poll;
  message?: string;
}

// Type aliases for convenience
export type Poll = Database['public']['Tables']['polls']['Row'] & {
  poll_options: Database['public']['Tables']['poll_options']['Row'][];
  profiles?: Database['public']['Tables']['profiles']['Row'];
};

export type PollOption = Database['public']['Tables']['poll_options']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];

// Re-export validation types
export type { CreatePollInput, VoteInput, UpdatePollInput } from '@/lib/validations/poll';
