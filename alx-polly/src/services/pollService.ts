import { ApiResponse, ApiError, VoteResult, Poll } from '@/types/api';
import { CreatePollInput } from '@/lib/validations/poll';
import { PollType } from '@/types/pollTypes';
import config, { buildApiUrl } from '@/lib/config';

export class PollService {
  private static baseUrl = buildApiUrl('/polls');
  private static timeout = config.api.timeout;

  private static async fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError('Request timeout', 408);
      }
      throw error;
    }
  }

  static async createPoll(data: CreatePollInput): Promise<ApiResponse<Poll>> {
    try {
      const response = await this.fetchWithTimeout(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      return this.handleResponse<Poll>(response);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to create poll', 500);
    }
  }

  static async getPoll(id: string): Promise<ApiResponse<Poll>> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/${id}`);
      return this.handleResponse<Poll>(response);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to fetch poll', 500);
    }
  }

  static async getPolls(): Promise<ApiResponse<Poll[]>> {
    try {
      const response = await this.fetchWithTimeout(this.baseUrl);
      return this.handleResponse<Poll[]>(response);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to fetch polls', 500);
    }
  }

  static async votePoll(pollId: string, optionId: string): Promise<ApiResponse<VoteResult>> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/${pollId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ option_id: optionId }),
      });
      
      return this.handleResponse<VoteResult>(response);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to vote', 500);
    }
  }

  static async submitAdvancedVote(
    voteData: any, 
    pollType: PollType
  ): Promise<ApiResponse<VoteResult>> {
    try {
      let endpoint: string;
      
      switch (pollType) {
        case PollType.SINGLE_CHOICE:
          endpoint = `${this.baseUrl}/${voteData.pollId}/vote`;
          break;
        case PollType.MULTIPLE_CHOICE:
          endpoint = `${this.baseUrl}/${voteData.pollId}/vote/multiple`;
          break;
        case PollType.RANKING:
          endpoint = `${this.baseUrl}/${voteData.pollId}/vote/ranking`;
          break;
        case PollType.RATING:
          endpoint = `${this.baseUrl}/${voteData.pollId}/vote/rating`;
          break;
        default:
          throw new ApiError('Unsupported poll type', 400);
      }

      const response = await this.fetchWithTimeout(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(voteData),
      });
      
      return this.handleResponse<VoteResult>(response);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to submit advanced vote', 500);
    }
  }

  private static async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const data = await response.json().catch(() => ({}));
    
    if (!response.ok) {
      const errorMessage = data.error || data.message || `HTTP ${response.status}: ${response.statusText}`;
      throw new ApiError(errorMessage, response.status);
    }
    
    // Handle different response formats
    if (data.success !== undefined) {
      return data; // Already in ApiResponse format
    }
    
    // Wrap raw data in ApiResponse format
    return {
      success: true,
      data: data as T,
      message: 'Success'
    };
  }
}
