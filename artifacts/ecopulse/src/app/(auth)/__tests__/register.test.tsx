import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RegisterPage from '../register/page';
import * as firebaseAuth from 'firebase/auth';

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all form fields', () => {
    render(<RegisterPage />);
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register node/i })).toBeInTheDocument();
  });

  it('shows validation error for short name', async () => {
    render(<RegisterPage />);
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'A' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'Password1' } });
    fireEvent.click(screen.getByRole('button', { name: /register node/i }));

    await waitFor(() => {
      expect(screen.getByText(/between 2 and 100/i)).toBeInTheDocument();
    });
  });

  it('shows validation error for weak password', async () => {
    render(<RegisterPage />);
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'weakpw' } });
    fireEvent.click(screen.getByRole('button', { name: /register node/i }));

    await waitFor(() => {
      expect(screen.getByText(/8\+/i)).toBeInTheDocument();
    });
  });

  it('calls createUserWithEmailAndPassword on valid input', async () => {
    vi.mocked(firebaseAuth.createUserWithEmailAndPassword).mockResolvedValueOnce({
      user: { uid: '123', updateProfile: vi.fn() }
    } as any);
    vi.mocked(firebaseAuth.updateProfile).mockResolvedValueOnce(undefined);

    render(<RegisterPage />);
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'john@test.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'Password1' } });
    fireEvent.click(screen.getByRole('button', { name: /register node/i }));

    await waitFor(() => {
      expect(firebaseAuth.createUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(), 'john@test.com', 'Password1'
      );
    });
  });
});