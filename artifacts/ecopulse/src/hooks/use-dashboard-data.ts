"use client";

import { useMemo } from "react";
import { Firestore, Query } from "firebase/firestore";
import { useCollection, useFirebase } from "@/firebase";
import type { Activity, CarbonRecord } from "@/types";
import { buildUserActivitiesQuery, buildUserCalculatorRecordsQuery } from "@/lib/firestore-queries";

type FirestoreTimestamp = { seconds?: number };

function sortByTimestamp<T extends { timestamp: unknown }>(items: T[], order: "asc" | "desc"): T[] {
  return [...items].sort((a, b) => {
    const aS = (a.timestamp as FirestoreTimestamp)?.seconds ?? 0;
    const bS = (b.timestamp as FirestoreTimestamp)?.seconds ?? 0;
    return order === "desc" ? bS - aS : aS - bS;
  });
}

/**
 * Aggregates dashboard telemetry including recent activities and carbon records.
 * Reads the shared profile from the global Firebase context to eliminate duplicate listeners.
 * Records and activities are sorted client-side to avoid Firestore composite index requirements.
 */
export function useDashboardData(userId: string | undefined, db: Firestore | undefined) {
  const { profile, isProfileLoading } = useFirebase();

  const activitiesQuery = useMemo(() => {
    if (!db || !userId) return null;
    return buildUserActivitiesQuery(db, userId, 5) as unknown as Query<Activity>;
  }, [db, userId]);
  const { data: rawActivities, isLoading: activitiesLoading } =
    useCollection<Activity>(activitiesQuery);

  const recordsQuery = useMemo(() => {
    if (!db || !userId) return null;
    return buildUserCalculatorRecordsQuery(db, userId, {
      limitCount: 10,
    }) as unknown as Query<CarbonRecord>;
  }, [db, userId]);
  const { data: rawRecords, isLoading: recordsLoading } = useCollection<CarbonRecord>(recordsQuery);

  const activities = useMemo(
    () => (rawActivities ? sortByTimestamp(rawActivities, "desc").slice(0, 5) : null),
    [rawActivities]
  );

  const records = useMemo(
    () => (rawRecords ? sortByTimestamp(rawRecords, "desc").slice(0, 10) : null),
    [rawRecords]
  );

  return {
    profile,
    activities,
    records,
    isLoading: isProfileLoading || activitiesLoading || recordsLoading,
  };
}
