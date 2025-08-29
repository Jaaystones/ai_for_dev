// Mock Supabase client to avoid ESM parsing issues
jest.mock('@/lib/supabase/client', () => ({
  createSupabaseClient: () => ({
    getChannels: () => [],
  }),
}));
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PollList from "../PollList";


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

  // Now check for dashboard text
  expect(screen.getByText(/Poll Results Dashboard/i)).toBeInTheDocument();

  // Find the first poll's vote button
  const voteButton = await screen.findByRole("button", { name: /JavaScript \(45 votes\)/i });
  fireEvent.click(voteButton);

  // Optimistic update: button should be disabled
  expect(voteButton).toBeDisabled();

  // Wait for UI to sync with API response
  await waitFor(() => {
    expect(screen.getByRole("button", { name: /JavaScript \(46 votes\)/i })).toBeInTheDocument();
  });
});
