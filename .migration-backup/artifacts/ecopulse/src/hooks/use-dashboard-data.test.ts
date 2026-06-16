import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useDashboardData } from './use-dashboard-data';
import * as firebaseHooks from '@/firebase';

vi.mock('@/firebase', () => ({
  useFirebase: vi.fn(),
  useCollection: vi.fn(),
  useDoc: vi.fn(),
}));

describe('useDashboardData', () => {
  it('correctly shapes and returns aggregated telemetry data', () => {
    const mockProfile = { uid: '123', fullName: 'Alice', greenPoints: 100 };
    const mockActivities = [{ id: 'act1', type: 'milestone', description: 'Joined' }];
    const mockRecords = [{ id: 'rec1', co2: 5.5, mode: 'car' }];

    vi.mocked(firebaseHooks.useFirebase as () => unknown).mockReturnValue({
      profile: mockProfile,
      isProfileLoading: false,
    });

    vi.mocked(firebaseHooks.useCollection as (q: unknown) => unknown)
      .mockReturnValueOnce({ data: mockActivities, isLoading: false })
      .mockReturnValueOnce({ data: mockRecords, isLoading: false });

    const { result } = renderHook(() => useDashboardData('123', {} as never));

    expect(result.current.profile).toEqual(mockProfile);
    expect(result.current.activities).toEqual(mockActivities);
    expect(result.current.records).toEqual(mockRecords);
    expect(result.current.isLoading).toBe(false);
  });

  it('indicates loading if any dependency is still loading', () => {
    vi.mocked(firebaseHooks.useFirebase as () => unknown).mockReturnValue({
      profile: null,
      isProfileLoading: true,
    });

    vi.mocked(firebaseHooks.useCollection as (q: unknown) => unknown).mockReturnValue({
      data: [],
      isLoading: false,
    });

    const { result } = renderHook(() => useDashboardData('123', {} as never));

    expect(result.current.isLoading).toBe(true);
  });
});
