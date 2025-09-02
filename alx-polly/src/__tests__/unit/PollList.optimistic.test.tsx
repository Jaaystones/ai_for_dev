// Mock Supabase client with comprehensive methods
jest.mock('@/lib/supabase/client', () => ({
  createSupabaseClient: () => ({
    getChannels: () => [],
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        order: jest.fn(() => ({
          eq: jest.fn(() => ({
            gt: jest.fn(() => Promise.resolve({ 
              data: [
                {
                  id: "1",
                  title: "What's your favorite programming language for web development?",
                  poll_options: [
                    { id: "1", text: "JavaScript", vote_count: 45 },
                    { id: "2", text: "Python", vote_count: 38 },
                    { id: "3", text: "TypeScript", vote_count: 32 },
                    { id: "4", text: "Go", vote_count: 15 }
                  ],
                  created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
                  expires_at: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
                  is_active: true,
                  profiles: { username: "testuser", full_name: "Test User" }
                }
              ], 
              error: null 
            }))
          }))
        }))
      }))
    })),
    channel: jest.fn(() => ({
      on: jest.fn(() => ({
        subscribe: jest.fn(() => ({ unsubscribe: jest.fn() }))
      }))
    }))
  }),
}));

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PollList from "@/features/polls/PollList";

// Mock fetch for voting API
beforeAll(() => {
  global.fetch = jest.fn((url: RequestInfo | URL | Request, options?: any) => {
    if (String(url).includes("/api/polls/1/vote")) {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            success: true,
            poll: {
              id: "1",
              question: "What's your favorite programming language for web development?",
              poll_options: [
                { id: "1", text: "JavaScript", votes: 46 },
                { id: "2", text: "Python", votes: 38 },
                { id: "3", text: "TypeScript", votes: 32 },
                { id: "4", text: "Go", votes: 15 }
              ],
              totalVotes: 131,
              isExpired: false,
              createdAt: new Date(),
              expiresAt: new Date(),
            }
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );
    }
    return Promise.resolve(
      new Response(
        JSON.stringify({ success: false }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    );
  });
});

afterAll(() => {
  // @ts-ignore
  global.fetch.mockRestore && global.fetch.mockRestore();
});

test("optimistic voting updates UI and syncs with API results", async () => {
  render(<PollList />);
  // Wait for loading spinner to disappear with a longer timeout
  await waitFor(() => {
    expect(screen.queryByText(/Loading amazing polls.../i)).not.toBeInTheDocument();
  }, { timeout: 3000 }); // Increased timeout to 3 seconds

  // Now check for actual poll content
  expect(screen.getByText(/What's your favorite programming language for web development/i)).toBeInTheDocument();

  // Find the first poll's vote button (using role="button" and name pattern)
  const voteButton = await screen.findByRole("button", { name: /JavaScript.*45/i });
  fireEvent.click(voteButton);

  // Optimistic update: button should be disabled
  expect(voteButton).toBeDisabled();

  // Wait for UI to sync with optimistic update (should show incremented count)
  await waitFor(() => {
    expect(screen.getByText(/JavaScript.*46/)).toBeInTheDocument();
  });
});
