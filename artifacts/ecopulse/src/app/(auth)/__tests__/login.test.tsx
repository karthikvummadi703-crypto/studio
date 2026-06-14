import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LoginPage from '../login/page';
import * as firebaseAuth from 'firebase/auth';

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all form elements', () => {
    render(<LoginPage />);
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('does not submit when email is empty', async () => {
    render(<LoginPage />);
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(firebaseAuth.signInWithEmailAndPassword).not.toHaveBeenCalled();
  });

  it('does not submit when password is empty', async () => {
    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@test.com' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(firebaseAuth.signInWithEmailAndPassword).not.toHaveBeenCalled();
  });

  it('calls signInWithEmailAndPassword with correct values', async () => {
    vi.mocked(firebaseAuth.signInWithEmailAndPassword).mockResolvedValueOnce({
      user: { getIdToken: vi.fn().mockResolvedValue('mock-token'), uid: '123' }
    } as any);

    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'user@test.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(firebaseAuth.signInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'user@test.com',
        'password123'
      );
    });
  });

  it('shows error toast on invalid credentials', async () => {
    vi.mocked(firebaseAuth.signInWithEmailAndPassword).mockRejectedValueOnce(
      new Error('auth/wrong-password')
    );

    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'user@test.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrongpass1' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/login failed/i)).toBeInTheDocument();
    });
  });

  it('calls signInWithPopup for Google login', async () => {
    vi.mocked(firebaseAuth.signInWithPopup).mockResolvedValueOnce({
      user: { uid: '123', displayName: 'Test', email: 'test@test.com', getIdToken: vi.fn().mockResolvedValue('tok') }
    } as any);

    render(<LoginPage />);
    fireEvent.click(screen.getByRole('button', { name: /google/i }));

    await waitFor(() => {
      expect(firebaseAuth.signInWithPopup).toHaveBeenCalled();
    });
  });
});
