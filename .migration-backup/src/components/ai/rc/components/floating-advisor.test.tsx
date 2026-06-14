import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FloatingAIAdvisor } from './floating-advisor';

// Mock firebase hooks
vi.mock('@/firebase', () => ({
  useUser: vi.fn(),
  useDoc: vi.fn(),
  useFirestore: vi.fn(),
}));

// Mock levels utility
vi.mock('@/lib/levels', () => ({
  getLevelFromPoints: vi.fn(() => 'Seedling'),
}));

import { useUser, useDoc, useFirestore } from '@/firebase';

const mockUser = {
  uid: 'test-uid-123',
  getIdToken: vi.fn().mockResolvedValue('mock-id-token'),
};

describe('FloatingAIAdvisor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useUser as ReturnType<typeof vi.fn>).mockReturnValue({ user: mockUser });
    (useDoc as ReturnType<typeof vi.fn>).mockReturnValue({ data: null });
    (useFirestore as ReturnType<typeof vi.fn>).mockReturnValue({});
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => 'Try cycling to work!',
    });
  });

  it('renders the open button when user is logged in', () => {
    render(<FloatingAIAdvisor />);
    const btn = screen.getByRole('button', { name: /open ai advisor/i });
    expect(btn).toBeTruthy();
  });

  it('returns null when no user is authenticated', () => {
    (useUser as ReturnType<typeof vi.fn>).mockReturnValue({ user: null });
    const { container } = render(<FloatingAIAdvisor />);
    expect(container.firstChild).toBeNull();
  });

  it('opens the advisor dialog on button click', async () => {
    render(<FloatingAIAdvisor />);
    const btn = screen.getByRole('button', { name: /open ai advisor/i });
    fireEvent.click(btn);
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /ecopulse ai advisor/i })).toBeTruthy();
    });
  });

  it('toggle button aria-expanded reflects open state', async () => {
    render(<FloatingAIAdvisor />);
    const btn = screen.getByRole('button', { name: /open ai advisor/i });
    expect(btn.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(btn);
    await waitFor(() => {
      expect(btn.getAttribute('aria-expanded')).toBe('true');
    });
  });

  it('shows welcome message when opened', async () => {
    render(<FloatingAIAdvisor />);
    fireEvent.click(screen.getByRole('button', { name: /open ai advisor/i }));
    await waitFor(() => {
      expect(screen.getByText(/gemini-powered advisor/i)).toBeTruthy();
    });
  });

  it('closes when the X button is clicked', async () => {
    render(<FloatingAIAdvisor />);
    fireEvent.click(screen.getByRole('button', { name: /open ai advisor/i }));
    await waitFor(() => screen.getByRole('dialog'));
    fireEvent.click(screen.getByRole('button', { name: /close advisor/i }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });
});
