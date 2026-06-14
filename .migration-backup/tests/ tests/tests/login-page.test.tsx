import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LoginPage from '@/app/(auth)/login/page';
import * as firebaseAuth from 'firebase/auth';

describe('LoginPage — accessibility', () => {
  it('email input has correct autocomplete attribute', () => {
    render(<LoginPage />);
    const emailInput = screen.getByLabelText(/email address/i);
    expect(emailInput).toHaveAttribute('autocomplete', 'email');
  });

  it('password input has correct autocomplete attribute', () => {
    render(<LoginPage />);
    const passwordInput = screen.getByLabelText(/password/i);
    expect(passwordInput).toHaveAttribute('autocomplete', 'current-password');
  });

  it('Google button has aria-label', () => {
    render(<LoginPage />);
    expect(
      screen.getByRole('button', { name: /sign in with google/i })
    ).toBeInTheDocument();
  });

  it('Demo button has aria-label', () => {
    render(<LoginPage />);
    expect(
      screen.getByRole('button', { name: /explore the app in demo mode/i })
    ).toBeInTheDocument();
  });

  it('forgot password link has descriptive aria-label', () => {
    render(<LoginPage />);
    expect(
      screen.getByRole('link', { name: /forgot your password/i })
    ).toBeInTheDocument();
  });

  it('register link is present', () => {
    render(<LoginPage />);
    expect(screen.getByRole('link', { name: /register node/i })).toBeInTheDocument();
  });
});

describe('LoginPage — form validation', () => {
  beforeEach(() => vi.clearAllMocks());

  it('disables all buttons while login is in progress', async () => {
    vi.mocked(firebaseAuth.signInWithEmailAndPassword).mockImplementation(
      () => new Promise(() => {}) // never resolves — simulates loading
    );
    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'pass1234' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /sign in with google/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /explore the app in demo mode/i })).toBeDisabled();
    });
  });
});
