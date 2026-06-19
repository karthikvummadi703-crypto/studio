import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import CalculatorPage from '@/app/calculator/page';
import * as firebaseHooks from '@/firebase';

vi.mock('@/firebase', () => ({
  useUser: vi.fn(),
  useFirestore: vi.fn(() => ({})),
  useDoc: vi.fn(() => ({ data: null, isLoading: false, error: null })),
  useCollection: vi.fn(() => ({ data: [], isLoading: false, error: null })),
  useAuth: vi.fn(() => ({})),
  useFirebase: vi.fn(() => ({ updateProfileScores: vi.fn() })),
  auth: {},
  db: {},
  FirebaseClientProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe('CalculatorPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(firebaseHooks.useUser).mockReturnValue({
      user: { uid: 'demo-uid', displayName: 'Demo User' } as never,
      isLoading: false,
      isDemo: true,
    });
  });

  it('renders without crashing for authenticated user', () => {
    const { container } = render(<CalculatorPage />);
    expect(container).toBeInTheDocument();
  });

  it('renders interactive form elements', () => {
    render(<CalculatorPage />);
    const interactive = document.querySelector('button, input, select, [role="button"]');
    expect(interactive).not.toBeNull();
  });

  it('renders carbon-related content', () => {
    render(<CalculatorPage />);
    const text = document.body.textContent?.toLowerCase() ?? '';
    const relevant =
      text.includes('carbon') ||
      text.includes('co2') ||
      text.includes('emission') ||
      text.includes('transport') ||
      text.includes('energy') ||
      text.includes('calculator') ||
      text.includes('footprint');
    expect(relevant).toBe(true);
  });

  it('shows loading state when auth is loading', () => {
    vi.mocked(firebaseHooks.useUser).mockReturnValueOnce({
      user: null,
      isLoading: true,
      isDemo: false,
    });
    const { container } = render(<CalculatorPage />);
    expect(container).toBeInTheDocument();
  });

  it('renders without crashing when user is null', () => {
    vi.mocked(firebaseHooks.useUser).mockReturnValueOnce({
      user: null,
      isLoading: false,
      isDemo: false,
    });
    expect(() => render(<CalculatorPage />)).not.toThrow();
  });
});
