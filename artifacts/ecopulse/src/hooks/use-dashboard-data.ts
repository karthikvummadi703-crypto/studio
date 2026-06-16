'use client';

import { useMemo } from 'react';
import { Firestore } from 'firebase/firestore';
import { useCollection, useFirebase } from '@/firebase';
import type { Activity, CarbonRecord } from '@/types';
import { buildUserActivitiesQuery, buildUserCalculatorRecordsQuery } from '@/lib/firestore-queries';

/**
 * Aggregates dashboard telemetry including recent activities and carbon records.
 * Reads the shared profile from the global Firebase context to eliminate duplicate listeners.
 * Records and activities are sorted client-side to avoid Firestore composite index requirements.
 */
export function useDashboardData(userId: string | undefined, db: Firestore | undefined) {
  const { profile, isProfileLoading } = useFirebase();

  const activitiesQuery = useMemo(() => {
    if (!db || !userId) return null;
    return buildUserActivitiesQuery(db, userId, 5);
  }, [db, userId]);
  const { data: rawActivities, isLoading: activitiesLoading } = useCollection<Activity>(activitiesQuery);

  const recordsQuery = useMemo(() => {
    if (!db || !userId) return null;
    return buildUserCalculatorRecordsQuery(db, userId, { limitCount: 10 });
  }, [db, userId]);
  const { data: rawRecords, isLoading: recordsLoading } = useCollection<CarbonRecord>(recordsQuery);

  const activities = useMemo(() => {
    if (!rawActivities) return null;
    return [...rawActivities].sort((a, b) => {
      const aTime = (a.timestamp as { seconds?: number })?.seconds ?? 0;
      const bTime = (b.timestamp as { seconds?: number })?.seconds ?? 0;
      return bTime - aTime;
    }).slice(0, 5);
  }, [rawActivities]);

  const records = useMemo(() => {
    if (!rawRecords) return null;
    return [...rawRecords].sort((a, b) => {
      const aTime = (a.timestamp as { seconds?: number })?.seconds ?? 0;
      const bTime = (b.timestamp as { seconds?: number })?.seconds ?? 0;
      return bTime - aTime;
    }).slice(0, 10);
  }, [rawRecords]);

  const isLoading = isProfileLoading || activitiesLoading || recordsLoading;

  return {
    profile,
    activities,
    records,
    isLoading
  };
}
