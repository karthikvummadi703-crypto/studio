---
name: Firestore query strategy
description: EcoPulse uses where-only queries to avoid composite index requirements; sorting is done client-side.
---

## Rule
Never combine `where('userId', '==', ...)` with `orderBy(...)` in a single Firestore query. This combination requires a composite index that must be manually created in the Firebase Console.

**Why:** The Firebase project does not have composite indexes configured. Any query with both `where` and `orderBy` on different fields will throw `failed-precondition` at runtime.

**How to apply:**
- All query builder functions in `firestore-queries.ts` use `where` + optional `limit` only.
- Callers sort results client-side after the snapshot arrives.
- The `limit` in queries is multiplied (e.g. `limitCount * 4`) to over-fetch before client-side slicing, since we can't use `orderBy` to get the "top N" records efficiently.
