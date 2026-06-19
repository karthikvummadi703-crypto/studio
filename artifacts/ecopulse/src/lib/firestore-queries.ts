import {
  collection,
  query,
  where,
  limit,
  Firestore,
  Query,
  DocumentData,
  QueryConstraint,
} from "firebase/firestore";
import { COLLECTIONS } from "./constants";

/**
 * Factory for user conversation queries.
 * Capped at 50 to prevent unbounded Firestore reads.
 * Sorted client-side to avoid composite index on userId + updatedAt.
 * @param db Firestore instance.
 * @param userId Authenticated user ID.
 */
export function buildUserConversationsQuery(db: Firestore, userId: string): Query<DocumentData> {
  return query(
    collection(db, COLLECTIONS.AI_CONVERSATIONS),
    where("userId", "==", userId),
    limit(50)
  );
}

/**
 * Factory for user activity log queries.
 * Sorted client-side to avoid composite index on userId + timestamp.
 * @param db Firestore instance.
 * @param userId Authenticated user ID.
 * @param limitCount Approximate upper bound (over-fetches then slices client-side).
 */
export function buildUserActivitiesQuery(
  db: Firestore,
  userId: string,
  limitCount = 5
): Query<DocumentData> {
  return query(
    collection(db, COLLECTIONS.ACTIVITIES),
    where("userId", "==", userId),
    limit(limitCount * 4)
  );
}

/**
 * Factory for user carbon footprint record queries.
 * Sorted client-side to avoid composite index on userId + timestamp.
 * @param db Firestore instance.
 * @param userId Authenticated user ID.
 * @param options sortOrder is applied client-side; limitCount is an approximate upper bound.
 */
export function buildUserCalculatorRecordsQuery(
  db: Firestore,
  userId: string,
  options: { sortOrder?: "asc" | "desc"; limitCount?: number } = {}
): Query<DocumentData> {
  const { limitCount } = options;
  const constraints: QueryConstraint[] = [where("userId", "==", userId)];

  if (limitCount) {
    constraints.push(limit(limitCount * 4));
  }

  return query(collection(db, COLLECTIONS.CALCULATOR_RECORDS), ...constraints);
}
