
'use client';

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

    (firebaseHooks.useFirebase as any).mockReturnValue({
      profile: mockProfile,
      isProfileLoading: false,
    });

    (firebaseHooks.useCollection as any).mockImplementation((query: any) => {
      if (query && query.path?.includes('activities')) {
        return { data: mockActivities, isLoading: false };
      }
      return { data: mockRecords, isLoading: false };
    });

    const { result } = renderHook(() => useDashboardData('123', {} as any));

    expect(result.current.profile).toEqual(mockProfile);
    expect(result.current.activities).toEqual(mockActivities);
    expect(result.current.records).toEqual(mockRecords);
    expect(result.current.isLoading).toBe(false);
  });

  it('indicates loading if any dependency is still loading', () => {
    (firebaseHooks.useFirebase as any).mockReturnValue({
      profile: null,
      isProfileLoading: true,
    });

    (firebaseHooks.useCollection as any).mockReturnValue({
      data: [],
      isLoading: false,
    });

    const { result } = renderHook(() => useDashboardData('123', {} as any));

    expect(result.current.isLoading).toBe(true);
  });
});
