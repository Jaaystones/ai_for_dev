/**
 * @file PollCreationVotingFlow.integration.test.tsx
 * @description Simplified integration test for poll display and voting workflow
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from '@testing-library/user-event';
import { AuthProvider } from "@/contexts/AuthContext";
import CreatePollForm from "@/features/create-poll/CreatePollForm";
import PollList from "@/features/polls/PollList";

// Mock Next.js router
const mockPush = jest.fn();
const mockRefresh = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh
  })
}));

// Mock Supabase client with test poll data
jest.mock('@/lib/supabase/client', () => ({
  createSupabaseClient: () => ({
    auth: {
      getUser: () => Promise.resolve({
        data: {
          user: {
            id: "integration-user-id",
            email: "integration@test.com"
          }
        },
        error: null
      }),
      getSession: () => Promise.resolve({
        data: { session: { user: { id: "integration-user-id" } } },
        error: null
      }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => {} } }
      })
    },
    from: (table: string) => {
      if (table === 'polls') {
        return {
          select: () => ({
            order: () => ({
              eq: () => ({
                gt: () => Promise.resolve({
                  data: [
                    {
                      id: "integration-poll-1",
                      title: "Best JavaScript Framework?",
                      description: null,
                      created_by: "integration-user-id",
                      created_at: "2024-09-01T10:00:00Z",
                      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
                      is_active: true,
                      allow_multiple_votes: false,
                      require_auth: true,
                      qr_code_url: null,
                      total_votes: 0,
                      settings: null,
                      poll_options: [
                        {
                          id: "option-1",
                          poll_id: "integration-poll-1",
                          text: "React",
                          description: null,
                          order_index: 0,
                          vote_count: 45,
                          created_at: "2024-09-01T10:00:00Z"
                        },
                        {
                          id: "option-2", 
                          poll_id: "integration-poll-1",
                          text: "Vue",
                          description: null,
                          order_index: 1,
                          vote_count: 38,
                          created_at: "2024-09-01T10:00:00Z"
                        }
                      ],
                      profiles: {
                        username: "integrationuser",
                        full_name: "Integration Test User"
                      }
                    }
                  ],
                  error: null
                })
              })
            })
          })
        };
      }
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({
                data: { 
                  id: "integration-user-id", 
                  username: "integrationuser",
                  full_name: "Integration Test User"
                },
                error: null
              })
            })
          })
        };
      }
      return {};
    },
    channel: (channelName: string) => ({
      on: () => ({ 
        subscribe: () => ({ unsubscribe: () => {} })
      })
    }),
    getChannels: () => []
  })
}));

// Mock fetch for voting API and poll creation API
const mockFetch = jest.fn();
global.fetch = mockFetch;

const renderWithAuth = (component: React.ReactElement) => {
  return render(
    <AuthProvider>
      {component}
    </AuthProvider>
  );
};

describe('Poll Creation and Voting Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful responses for different API endpoints
    mockFetch.mockImplementation((url: string, options?: any) => {
      if (url.includes('/vote') && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ 
            success: true,
            vote: { id: "vote-123" }
          })
        });
      }
      
      if (url.includes('/api/polls') && options?.method === 'POST') {
        // Mock poll creation endpoint
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            poll: {
              id: "new-poll-123",
              title: JSON.parse(options.body).title,
              description: JSON.parse(options.body).description
            }
          })
        });
      }
      
      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Not found' })
      });
    });
  });

  test('displays poll creation form correctly', async () => {
    renderWithAuth(<CreatePollForm />);
    
    // Wait for authentication to load
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    }, { timeout: 3000 });
    
    // Verify form elements are present
    expect(screen.getByText(/create a new poll/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/poll question/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create poll/i })).toBeInTheDocument();
  });

  test('displays poll list with voting options', async () => {
    renderWithAuth(<PollList />);
    
    // Wait for polls to load
    await waitFor(() => {
      expect(screen.queryByText(/loading amazing polls/i)).not.toBeInTheDocument();
    }, { timeout: 3000 });
    
    // Should show mocked poll
    expect(screen.getByText(/Best JavaScript Framework?/i)).toBeInTheDocument();
    
    // Should show voting options with counts
    expect(screen.getByRole('button', { name: /React.*45/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Vue.*38/i })).toBeInTheDocument();
  });

  test('handles voting with optimistic updates', async () => {
    renderWithAuth(<PollList />);
    
    await waitFor(() => {
      expect(screen.queryByText(/loading amazing polls/i)).not.toBeInTheDocument();
    }, { timeout: 3000 });

    // Find and click vote button
    const reactButton = await screen.findByRole('button', { name: /React.*45/i });
    fireEvent.click(reactButton);
    
    // Should show optimistic update (45 + 1 = 46)
    await waitFor(() => {
      expect(screen.getByText(/React.*46/)).toBeInTheDocument();
    });
    
    // Button should be disabled during voting
    expect(reactButton).toBeDisabled();
  });

  test('prevents multiple votes on same poll', async () => {
    renderWithAuth(<PollList />);
    
    await waitFor(() => {
      expect(screen.queryByText(/loading amazing polls/i)).not.toBeInTheDocument();
    }, { timeout: 3000 });

    // Get both vote buttons
    const reactButton = await screen.findByRole('button', { name: /React.*45/i });
    const vueButton = await screen.findByRole('button', { name: /Vue.*38/i });

    // Vote for React
    fireEvent.click(reactButton);

    // Both buttons should be disabled during voting
    expect(reactButton).toBeDisabled();
    expect(vueButton).toBeDisabled();

    // Try to vote for Vue while first vote is processing - should be prevented by UI
    fireEvent.click(vueButton);

    // Should show optimistic update for React only
    await waitFor(() => {
      expect(screen.getByText(/React.*46/)).toBeInTheDocument();
    });
  });

  test('form validation works correctly', async () => {
    renderWithAuth(<CreatePollForm />);
    
    // Wait for authentication to load
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    }, { timeout: 3000 });
    
    // Submit button should be disabled initially
    const submitButton = screen.getByRole('button', { name: /create poll/i });
    expect(submitButton).toBeDisabled();
    
    // Should show help text
    expect(screen.getByText(/make it engaging and specific to get the best responses/i)).toBeInTheDocument();
    expect(screen.getByText(/choose from popular programming languages/i)).toBeInTheDocument();
  });

  test('creates poll successfully with API integration', async () => {
    const user = userEvent.setup();
    
    renderWithAuth(<CreatePollForm />);
    
    // Wait for authentication to load
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    }, { timeout: 3000 });
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
    
    // Fill out the form
    const questionInput = screen.getByLabelText(/poll question/i);
    await user.type(questionInput, 'What is the best backend framework?');
    
    // Add first option
    const customInput = screen.getByPlaceholderText(/add your own programming language/i);
    await user.type(customInput, 'Express.js');
    const addButton = screen.getByRole('button', { name: /add/i });
    await user.click(addButton);
    
    // Add second option
    await user.clear(customInput);
    await user.type(customInput, 'FastAPI');
    await user.click(addButton);
    
    // Debug: Check the selected options in the UI
    const selectedOptions = screen.getAllByText(/Express\.js|FastAPI/);
    expect(selectedOptions.length).toBe(2);
    
    // Wait a bit for state updates to propagate
    await waitFor(() => {
      const submitButton = screen.getByRole('button', { name: /create poll/i });
      expect(submitButton).not.toBeDisabled();
    }, { timeout: 2000 });
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /create poll/i });

    await user.click(submitButton);
    
    // Give it a moment for any async operations
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Verify API call was made with correct data - this is the main assertion
    expect(mockFetch).toHaveBeenCalledWith('/api/polls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'What is the best backend framework?',
          description: 'Programming language preference poll',
          options: ['Express.js', 'FastAPI'],
          expiresIn: 24 * 60, // 24 hours in minutes
          allowMultipleVotes: false,
          requireAuth: true,
        })
      });
      
    // Verify navigation was called
    expect(mockPush).toHaveBeenCalledWith('/polls');
  }, 15000);
});
