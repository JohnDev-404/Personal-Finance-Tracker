import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

// Mock the auth context so we can render LoginPage without the full app.
const mockLogin = vi.fn();
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({ login: mockLogin }),
}));

// Mock useNavigate by providing a real router with a test route.
import LoginPage from '../pages/LoginPage';

function renderLogin(initialEntries = ['/login']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <LoginPage />
    </MemoryRouter>
  );
}

beforeEach(() => {
  mockLogin.mockReset();
});

describe('LoginPage', () => {
  it('submits email and password', async () => {
    mockLogin.mockResolvedValueOnce({});
    renderLogin();

    await userEvent.type(screen.getByLabelText('Email'), 'a@b.com');
    await userEvent.type(screen.getByLabelText('Password'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'a@b.com',
        password: 'password123',
      });
    });
  });

  it('shows the API error message on failure', async () => {
    mockLogin.mockRejectedValueOnce({
      response: { data: { error: 'Invalid email or password' } },
    });
    renderLogin();

    await userEvent.type(screen.getByLabelText('Email'), 'a@b.com');
    await userEvent.type(screen.getByLabelText('Password'), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(
      await screen.findByText('Invalid email or password')
    ).toBeInTheDocument();
  });

  it('shows the session-expired banner when ?expired=1', () => {
    renderLogin(['/login?expired=1']);
    expect(
      screen.getByText(/your session expired/i)
    ).toBeInTheDocument();
  });
});