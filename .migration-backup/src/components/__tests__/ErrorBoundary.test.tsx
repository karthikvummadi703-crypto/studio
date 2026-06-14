import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ErrorBoundary } from '../ErrorBoundary';

/**
 * Helper component that throws an error during render.
 */
const ThrowError = () => {
  throw new Error('Test crash');
};

describe('ErrorBoundary', () => {
  it('renders children correctly when no error occurs', () => {
    render(
      <ErrorBoundary>
        <p>Operational Status: Stable</p>
      </ErrorBoundary>
    );
    expect(screen.getByText('Operational Status: Stable')).toBeInTheDocument();
  });

  it('renders the fallback UI when a child component crashes', () => {
    // Suppress console.error for this test to keep logs clean
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.queryByText('Operational Status: Stable')).toBeNull();
    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    
    spy.mockRestore();
  });

  it('allows recovery when the "Try Again" button is clicked', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    // Verify error state
    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();

    // Click try again
    const tryAgainButton = screen.getByRole('button', { name: /try again/i });
    fireEvent.click(tryAgainButton);

    // Rerender with healthy children
    rerender(
      <ErrorBoundary>
        <p>System Recovered</p>
      </ErrorBoundary>
    );

    expect(screen.getByText('System Recovered')).toBeInTheDocument();
    expect(screen.queryByText(/Something went wrong/i)).toBeNull();
    
    spy.mockRestore();
  });
});
