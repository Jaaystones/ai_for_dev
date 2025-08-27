export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  createdAt: Date;
  expiresAt: Date;
  isExpired: boolean;
  totalVotes: number;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface CreatePollData {
  question: string;
  options: string[];
}
