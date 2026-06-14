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
 * @param db Firestore instance.
 * @param userId Authenticated user ID.
 * @param limitCount Optional limit for the query.
 */
export function buildUserActivitiesQuery(db: Firestore, userId: string, limitCount = 5): Query<DocumentData> {
  return query(
    collection(db, COLLECTIONS.ACTIVITIES),
    where('userId', '==', userId),
    orderBy('timestamp', 'desc'),
    limit(limitCount)
  );
}

/**
 * Factory for user carbon footprint record queries.
 * @param db Firestore instance.
 * @param userId Authenticated user ID.
 * @param options Configuration for sorting and limits.
 */
export function buildUserCalculatorRecordsQuery(
  db: Firestore,
  userId: string,
  options: { sortOrder?: 'asc' | 'desc'; limitCount?: number } = {}
): Query<DocumentData> {
  const { sortOrder = 'desc', limitCount } = options;
  const constraints: QueryConstraint[] = [
    where('userId', '==', userId),
    orderBy('timestamp', sortOrder)
  ];

  if (limitCount) {
    constraints.push(limit(limitCount));
  }

  return query(collection(db, COLLECTIONS.CALCULATOR_RECORDS), ...constraints);
}
