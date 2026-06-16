import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { ErrorBoundary } from '../ErrorBoundary';

const ThrowError = () => {
  throw new Error('Test crash');
};

describe('ErrorBoundary', () => {
  it('renders children correctly when no error occurs', () => {
    render(
      <ErrorBoundary>
        <p>Operational Status: Stable</p>
      </ErrorBoundary>,
    );
    expect(screen.getByText('Operational Status: Stable')).toBeInTheDocument();
  });

  it('renders the fallback UI when a child component crashes', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>,
    );
    expect(screen.queryByText('Operational Status: Stable')).toBeNull();
    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    spy.mockRestore();
  });

  it('allows recovery when the "Try Again" button is clicked', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    let shouldThrow = true;

    const ConditionalThrow = () => {
      if (shouldThrow) throw new Error('Test crash');
      return <p>System Recovered</p>;
    };

    render(
      <ErrorBoundary>
        <ConditionalThrow />
      </ErrorBoundary>,
    );

    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();

    shouldThrow = false;
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    expect(screen.getByText('System Recovered')).toBeInTheDocument();
    expect(screen.queryByText(/Something went wrong/i)).toBeNull();
    spy.mockRestore();
  });
});
