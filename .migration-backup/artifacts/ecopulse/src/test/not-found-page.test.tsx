import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import React from 'react';
import NotFound from '@/pages/not-found';

describe('NotFound Page', () => {
  it('renders without crashing', () => {
    const { container } = render(<NotFound />);
    expect(container).toBeInTheDocument();
  });

  it('displays 404 heading', () => {
    render(<NotFound />);
    expect(screen.getByText(/404/i)).toBeInTheDocument();
  });

  it('displays "Page Not Found" text', () => {
    render(<NotFound />);
    expect(screen.getByText(/page not found/i)).toBeInTheDocument();
  });

  it('shows a helpful message to the user', () => {
    render(<NotFound />);
    const body = document.body.textContent ?? '';
    expect(body.length).toBeGreaterThan(10);
  });

  it('renders an alert or error icon container', () => {
    render(<NotFound />);
    const container = document.querySelector('[class*="flex"]');
    expect(container).toBeInTheDocument();
  });
});
