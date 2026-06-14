
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Dashboard from '../page';
import * as dashboardHooks from '@/hooks/use-dashboard-data';
import * as firebaseHooks from '@/firebase';

vi.mock('@/hooks/use-dashboard-data', () => ({
  useDashboardData: vi.fn(),
}));

vi.mock('@/firebase', () => ({
  useUser: vi.fn(),
  useFirestore: vi.fn(),
  useFirebase: vi.fn(),
}));

describe('Dashboard Smoke Test', () => {
  it('renders without crashing and displays user name', () => {
    const mockUser = { uid: '123', displayName: 'Alice' };
    const mockProfile = { fullName: 'Alice Eco', greenPoints: 500, sustainabilityScore: 75 };
    const mockRecords = [{ co2: 2.5, timestamp: new Date() }];

    (firebaseHooks.useUser as any).mockReturnValue({ user: mockUser, isLoading: false });
    (dashboardHooks.useDashboardData as any).mockReturnValue({
      profile: mockProfile,
      records: mockRecords,
      activities: [],
      isLoading: false,
    });

    render(<Dashboard />);

    // Verify user name is present
    expect(screen.getByText('Alice Eco')).toBeInTheDocument();
    
    // Verify key metrics are rendered
    expect(screen.getByText('75')).toBeInTheDocument(); // Score
    expect(screen.getByText('500')).toBeInTheDocument(); // Points
    
    // Verify UI components
    expect(screen.getByRole('button', { name: /new audit/i })).toBeInTheDocument();
  });

  it('renders empty state when no records exist', () => {
    (firebaseHooks.useUser as any).mockReturnValue({ user: { uid: '123' }, isLoading: false });
    (dashboardHooks.useDashboardData as any).mockReturnValue({
      profile: { fullName: 'Bob' },
      records: [],
      activities: [],
      isLoading: false,
    });

    render(<Dashboard />);

    expect(screen.getByText(/Environmental Node Initialized/i)).toBeInTheDocument();
    expect(screen.getByText(/Start First Audit/i)).toBeInTheDocument();
  });
});
