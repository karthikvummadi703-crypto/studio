import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ForgotPasswordPage from '../forgot-password/page';
import * as firebaseAuth from 'firebase/auth';

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the email input and submit button', () => {
    render(<ForgotPasswordPage />);
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
  });

  it('renders the back to sign in link', () => {
    render(<ForgotPasswordPage />);
    expect(screen.getByRole('link', { name: /back to sign in/i })).toBeInTheDocument();
  });

  it('does not submit if email is empty', async () => {
    render(<ForgotPasswordPage />);
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));
    expect(firebaseAuth.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('calls sendPasswordResetEmail with trimmed lowercase email', async () => {
    vi.mocked(firebaseAuth.sendPasswordResetEmail).mockResolvedValueOnce(undefined);
    render(<ForgotPasswordPage />);
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: '  Test@Example.COM  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));
    await waitFor(() => {
      expect(firebaseAuth.sendPasswordResetEmail).toHaveBeenCalledWith(
        expect.anything(),
        'test@example.com'
      );
    });
  });

  it('shows the success state after submission', async () => {
    vi.mocked(firebaseAuth.sendPasswordResetEmail).mockResolvedValueOnce(undefined);
    render(<ForgotPasswordPage />);
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'user@test.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));
    await waitFor(() => {
      expect(screen.getByText(/check your inbox/i)).toBeInTheDocument();
    });
  });

  it('shows success state even if Firebase returns user-not-found (prevents enumeration)', async () => {
    vi.mocked(firebaseAuth.sendPasswordResetEmail).mockRejectedValueOnce(
      new Error('auth/user-not-found')
    );
    render(<ForgotPasswordPage />);
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'ghost@test.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));
    await waitFor(() => {
      expect(screen.getByText(/check your inbox/i)).toBeInTheDocument();
    });
  });

  it('shows error toast for invalid email format', async () => {
    render(<ForgotPasswordPage />);
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'not-an-email' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));
    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
    });
    expect(firebaseAuth.sendPasswordResetEmail).not.toHaveBeenCalled();
  });
});
