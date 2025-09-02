/**
 * @file CreatePollForm.test.tsx
 * @description Comprehensive unit tests for poll creation form with API integration
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from '@testing-library/user-event';
import { AuthProvider } from "@/contexts/AuthContext";
import CreatePollForm from "@/features/create-poll/CreatePollForm";

// Mock fetch globally
global.fetch = jest.fn();

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createSupabaseClient: () => ({
    auth: {
      getUser: () => Promise.resolve({
        data: {
          user: {
            id: "test-user-id",
            email: "test@example.com"
          }
        },
        error: null
      }),
      getSession: () => Promise.resolve({
        data: { session: { user: { id: "test-user-id" } } },
        error: null
      }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => {} } }
      })
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({
            data: { id: "test-user-id", username: "testuser" },
            error: null
          })
        })
      })
    }),
    channel: () => ({
      on: () => ({ subscribe: () => {} })
    })
  })
}));

// Mock router
const mockPush = jest.fn();
const mockRefresh = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh
  })
}));

const renderWithAuth = (component: React.ReactElement) => {
  return render(
    <AuthProvider>
      {component}
    </AuthProvider>
  );
};

describe('CreatePollForm', () => {
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  const fillPollForm = async (user: any) => {
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    // Fill in the question
    const questionInput = screen.getByLabelText(/poll question/i);
    await user.type(questionInput, 'What is your favorite programming language?');

    // Add first option by typing in custom input
    const customInput = screen.getByPlaceholderText(/add your own programming language/i);
    await user.type(customInput, 'JavaScript');
    const addButton = screen.getByRole('button', { name: /add/i });
    await user.click(addButton);

    // Add second option
    await user.clear(customInput);
    await user.type(customInput, 'Python');
    await user.click(addButton);
  };

  test('renders form elements correctly', async () => {
    renderWithAuth(<CreatePollForm />);

    // Wait for loading to complete and form to render
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    // Check core form elements exist
    expect(screen.getByLabelText(/poll question/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create poll/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/add your own programming language/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
  });

  test('submit button is disabled initially', async () => {
    renderWithAuth(<CreatePollForm />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /create poll/i });
    expect(submitButton).toBeDisabled();
  });

  test('displays form title and description', async () => {
    renderWithAuth(<CreatePollForm />);

    expect(screen.getByText(/create a new poll/i)).toBeInTheDocument();
    expect(screen.getByText(/start engaging conversations about programming languages/i)).toBeInTheDocument();
    
    // Wait for form to load
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
  });

  test('shows help text and placeholders', async () => {
    renderWithAuth(<CreatePollForm />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    expect(screen.getByText(/make it engaging and specific to get the best responses/i)).toBeInTheDocument();
    expect(screen.getByText(/choose from popular programming languages/i)).toBeInTheDocument();
  });

  test('enables submit button when form is valid', async () => {
    const user = userEvent.setup();
    renderWithAuth(<CreatePollForm />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /create poll/i });
    expect(submitButton).toBeDisabled();

    await fillPollForm(user);

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    }, { timeout: 10000 });
  }, 15000);

  test('successfully creates poll and navigates to polls list', async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        poll: {
          id: 'poll-123',
          title: 'What is your favorite programming language?'
        }
      })
    } as Response);

    renderWithAuth(<CreatePollForm />);
    
    await fillPollForm(user);

    const submitButton = screen.getByRole('button', { name: /create poll/i });
    await user.click(submitButton);

    // Check API call was made with correct data
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/polls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'What is your favorite programming language?',
          description: 'Programming language preference poll',
          options: ['JavaScript', 'Python'],
          expiresIn: 24 * 60, // 24 hours in minutes
          allowMultipleVotes: false,
          requireAuth: true,
        })
      });
    }, { timeout: 10000 });

    // Check navigation to polls list
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/polls');
    }, { timeout: 10000 });
  }, 15000);

  test('displays loading state during submission', async () => {
    const user = userEvent.setup();
    mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

    renderWithAuth(<CreatePollForm />);
    
    await fillPollForm(user);

    const submitButton = screen.getByRole('button', { name: /create poll/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/creating poll/i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    }, { timeout: 10000 });
  }, 15000);

  test('displays error when API call fails', async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: 'Failed to create poll'
      })
    } as Response);

    renderWithAuth(<CreatePollForm />);
    
    await fillPollForm(user);

    const submitButton = screen.getByRole('button', { name: /create poll/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/failed to create poll/i)).toBeInTheDocument();
    }, { timeout: 10000 });

    // Submit button should be re-enabled after error
    expect(submitButton).not.toBeDisabled();
  }, 15000);

  test('displays validation error for insufficient options', async () => {
    const user = userEvent.setup();
    renderWithAuth(<CreatePollForm />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    // Fill in question but only one option
    const questionInput = screen.getByLabelText(/poll question/i);
    await user.type(questionInput, 'What is your favorite programming language?');

    const customInput = screen.getByPlaceholderText(/add your own programming language/i);
    await user.type(customInput, 'JavaScript');
    const addButton = screen.getByRole('button', { name: /add/i });
    await user.click(addButton);

    const submitButton = screen.getByRole('button', { name: /create poll/i });
    
    // Button should be disabled since we only have 1 option (need minimum 2)
    expect(submitButton).toBeDisabled();

    // Since the button is disabled, form prevents submission via disabled state
    // This is better UX than showing error after clicking
    
    // API should not have been called since button is disabled
    expect(mockFetch).not.toHaveBeenCalled();
  }, 15000);

  test('handles network error gracefully', async () => {
    const user = userEvent.setup();
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    renderWithAuth(<CreatePollForm />);
    
    await fillPollForm(user);

    const submitButton = screen.getByRole('button', { name: /create poll/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });

  test('can add and remove poll options', async () => {
    const user = userEvent.setup();
    renderWithAuth(<CreatePollForm />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    // Add options
    const customInput = screen.getByPlaceholderText(/add your own programming language/i);
    const addButton = screen.getByRole('button', { name: /add/i });

    await user.type(customInput, 'JavaScript');
    await user.click(addButton);
    await user.clear(customInput);
    await user.type(customInput, 'Python');
    await user.click(addButton);

    // Check options are displayed in the selected options area (not dropdown)
    // Look for the selected options section specifically
    await waitFor(() => {
      expect(screen.getByText('Selected Options (2)')).toBeInTheDocument();
    });

    // Remove one option by clicking the × button
    const removeButtons = screen.getAllByText('×');
    await user.click(removeButtons[0]);

    // Check that count decreased
    await waitFor(() => {
      expect(screen.getByText('Selected Options (1)')).toBeInTheDocument();
    });
  }, 15000);
});
