import {
  collection,
  query,
  where,
  orderBy,
  limit,
  Firestore,
  Query,
  DocumentData,
  QueryConstraint
} from 'firebase/firestore';
import { COLLECTIONS } from './constants';

/**
 * Factory for user conversation queries.
 * Capped at 50 to prevent unbounded Firestore reads.
 * @param db Firestore instance.
 * @param userId Authenticated user ID.
 */
export function buildUserConversationsQuery(db: Firestore, userId: string): Query<DocumentData> {
  return query(
    collection(db, COLLECTIONS.AI_CONVERSATIONS),
    where('userId', '==', userId),
    orderBy('updatedAt', 'desc'),
    limit(50)
  );
}

/**
 * Factory for user activity log queries.
 * Uses client-side sorting to avoid composite index requirements.
 * @param db Firestore instance.
 * @param userId Authenticated user ID.
 * @param limitCount Optional limit for the query (applied client-side).
 */
export function buildUserActivitiesQuery(db: Firestore, userId: string, limitCount = 5): Query<DocumentData> {
  return query(
    collection(db, COLLECTIONS.ACTIVITIES),
    where('userId', '==', userId),
    limit(limitCount * 4)
  );
}

/**
 * Factory for user carbon footprint record queries.
 * Sorts client-side to avoid composite index requirements on userId + timestamp.
 * @param db Firestore instance.
 * @param userId Authenticated user ID.
 * @param options Configuration for limits (sorting is done client-side).
 */
export function buildUserCalculatorRecordsQuery(
  db: Firestore,
  userId: string,
  options: { sortOrder?: 'asc' | 'desc'; limitCount?: number } = {}
): Query<DocumentData> {
  const { limitCount } = options;
  const constraints: QueryConstraint[] = [
    where('userId', '==', userId),
  ];

  if (limitCount) {
    constraints.push(limit(limitCount * 4));
  }

  return query(collection(db, COLLECTIONS.CALCULATOR_RECORDS), ...constraints);
}
