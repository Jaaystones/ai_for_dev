/**
 * @file VoteRecording.test.tsx  
 * @description Unit tests for vote recording with error handling and duplicate prevention
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PollVote from "@/features/polls/PollVote";
import { Poll } from "@/types/database";

// Mock poll data matching database schema
const mockPoll: Poll = {
  id: "test-poll-1",
  title: "Favorite Programming Language?",
  description: "Choose your preferred language for web development",
  created_by: "user-1",
  created_at: "2024-09-01T10:00:00Z",
  expires_at: "2024-09-02T10:00:00Z",
  is_active: true,
  allow_multiple_votes: false,
  require_auth: true,
  qr_code_url: null,
  total_votes: 5,
  settings: null,
  poll_options: [
    {
      id: "option-1",
      poll_id: "test-poll-1", 
      text: "JavaScript",
      description: null,
      order_index: 0,
      vote_count: 3,
      created_at: "2024-09-01T10:00:00Z"
    },
    {
      id: "option-2", 
      poll_id: "test-poll-1",
      text: "Python",
      description: null,
      order_index: 1,
      vote_count: 2,
      created_at: "2024-09-01T10:00:00Z"
    }
  ],
  profiles: {
    username: "testuser",
    full_name: "Test User"
  }
};

describe('VoteRecording', () => {
  const mockOnVote = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('records vote successfully with optimistic UI update', async () => {
    // Mock successful vote
    mockOnVote.mockResolvedValueOnce(undefined);

    render(<PollVote poll={mockPoll} onVote={mockOnVote} />);

    // Should show vote options with current counts
    expect(screen.getByText(/JavaScript \(3 votes\)/)).toBeInTheDocument();
    expect(screen.getByText(/Python \(2 votes\)/)).toBeInTheDocument();

    // Click to vote for JavaScript
    const jsButton = screen.getByRole('button', { name: /JavaScript \(3 votes\)/ });
    fireEvent.click(jsButton);

    // Should immediately show optimistic update (3 + 1 = 4)
    expect(screen.getByText(/JavaScript \(4 votes\)/)).toBeInTheDocument();
    
    // Should disable all buttons during voting
    expect(jsButton).toBeDisabled();
    expect(screen.getByRole('button', { name: /Python \(2 votes\)/ })).toBeDisabled();

    // Should call API with correct option ID
    expect(mockOnVote).toHaveBeenCalledWith("option-1");

    // After successful vote, buttons should remain disabled (until component re-renders with new data)
    await waitFor(() => {
      expect(mockOnVote).toHaveBeenCalledTimes(1);
    });
  });

  test('handles vote failure and reverts optimistic update', async () => {
    // Mock failed vote
    mockOnVote.mockRejectedValueOnce(new Error('Vote failed'));

    render(<PollVote poll={mockPoll} onVote={mockOnVote} />);

    const jsButton = screen.getByRole('button', { name: /JavaScript \(3 votes\)/ });
    fireEvent.click(jsButton);

    // Should show optimistic update initially
    expect(screen.getByText(/JavaScript \(4 votes\)/)).toBeInTheDocument();

    // After API failure, should revert to original count and show error
    await waitFor(() => {
      expect(screen.getByText(/JavaScript \(3 votes\)/)).toBeInTheDocument();
      expect(screen.getByText(/Vote failed. Please try again./)).toBeInTheDocument();
    });

    // Buttons should be re-enabled after error
    expect(jsButton).not.toBeDisabled();
  });

  test('handles network timeout gracefully', async () => {
    // Mock timeout
    mockOnVote.mockImplementationOnce(() => 
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 100)
      )
    );

    render(<PollVote poll={mockPoll} onVote={mockOnVote} />);

    const pythonButton = screen.getByRole('button', { name: /Python \(2 votes\)/ });
    fireEvent.click(pythonButton);

    // Should show optimistic update
    expect(screen.getByText(/Python \(3 votes\)/)).toBeInTheDocument();

    // Should revert after timeout and show error
    await waitFor(() => {
      expect(screen.getByText(/Python \(2 votes\)/)).toBeInTheDocument();
      expect(screen.getByText(/Vote failed. Please try again./)).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  test('prevents multiple votes on same poll', async () => {
    render(<PollVote poll={mockPoll} onVote={mockOnVote} />);

    const jsButton = screen.getByRole('button', { name: /JavaScript \(3 votes\)/ });
    const pythonButton = screen.getByRole('button', { name: /Python \(2 votes\)/ });

    // Vote for JavaScript
    fireEvent.click(jsButton);

    // Both buttons should be disabled during vote
    expect(jsButton).toBeDisabled();
    expect(pythonButton).toBeDisabled();

    // Try to vote for Python while first vote is processing
    fireEvent.click(pythonButton);

    // Should only call API once (for JavaScript)
    expect(mockOnVote).toHaveBeenCalledTimes(1);
    expect(mockOnVote).toHaveBeenCalledWith("option-1");
  });

  test('handles empty poll options gracefully', async () => {
    const emptyPoll = { ...mockPoll, poll_options: [] };

    render(<PollVote poll={emptyPoll} onVote={mockOnVote} />);

    // Should render without crashing
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  test('shows correct vote counts after successful vote', async () => {
    mockOnVote.mockResolvedValueOnce(undefined);

    render(<PollVote poll={mockPoll} onVote={mockOnVote} />);

    // Initial state
    expect(screen.getByText(/JavaScript \(3 votes\)/)).toBeInTheDocument();
    expect(screen.getByText(/Python \(2 votes\)/)).toBeInTheDocument();

    // Vote for Python
    const pythonButton = screen.getByRole('button', { name: /Python \(2 votes\)/ });
    fireEvent.click(pythonButton);

    // Should show optimistic update
    expect(screen.getByText(/Python \(3 votes\)/)).toBeInTheDocument();
    
    // JavaScript count should remain unchanged
    expect(screen.getByText(/JavaScript \(3 votes\)/)).toBeInTheDocument();

    await waitFor(() => {
      expect(mockOnVote).toHaveBeenCalledWith("option-2");
    });
  });

  test('maintains button state consistency during error recovery', async () => {
    let rejectVote: (error: Error) => void;
    const votePromise = new Promise<void>((_, reject) => {
      rejectVote = reject;
    });
    
    mockOnVote.mockReturnValueOnce(votePromise);

    render(<PollVote poll={mockPoll} onVote={mockOnVote} />);

    const jsButton = screen.getByRole('button', { name: /JavaScript \(3 votes\)/ });
    fireEvent.click(jsButton);

    // Should be disabled during vote
    expect(jsButton).toBeDisabled();

    // Simulate API error
    rejectVote!(new Error('Network error'));

    // Should re-enable after error
    await waitFor(() => {
      expect(jsButton).not.toBeDisabled();
      expect(screen.getByText(/Vote failed. Please try again./)).toBeInTheDocument();
    });
  });
});
