'use client';

import { useMemo } from 'react';
import { 
  Firestore 
} from 'firebase/firestore';
import { useCollection, useFirebase } from '@/firebase';
import type { Activity, CarbonRecord } from '@/types';
import { buildUserActivitiesQuery, buildUserCalculatorRecordsQuery } from '@/lib/firestore-queries';

/**
 * Aggregates dashboard telemetry including recent activities and carbon records.
 * Reads the shared profile from the global Firebase context to eliminate duplicate listeners.
 */
export function useDashboardData(userId: string | undefined, db: Firestore | undefined) {
  const { profile, isProfileLoading } = useFirebase();

  const activitiesQuery = useMemo(() => {
    if (!db || !userId) return null;
    return buildUserActivitiesQuery(db, userId, 5);
  }, [db, userId]);
  const { data: activities, isLoading: activitiesLoading } = useCollection<Activity>(activitiesQuery);

  const recordsQuery = useMemo(() => {
    if (!db || !userId) return null;
    return buildUserCalculatorRecordsQuery(db, userId, { limitCount: 10 });
  }, [db, userId]);
  const { data: records, isLoading: recordsLoading } = useCollection<CarbonRecord>(recordsQuery);

  const isLoading = isProfileLoading || activitiesLoading || recordsLoading;

  return {
    profile,
    activities,
    records,
    isLoading
  };
}
