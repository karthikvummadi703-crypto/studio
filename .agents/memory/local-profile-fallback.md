---
name: Local profile fallback
description: Dashboard scores are backed by localStorage when Firestore security rules block reads.
---

## Rule
Profile scores (`greenPoints`, `sustainabilityScore`) are stored in **both localStorage and Firestore**.
localStorage is always the immediate source of truth; Firestore syncs in the background when rules allow.

**Why:** Firebase Firestore defaults to "deny all" in production mode. Until the user deploys `firestore.rules`, `onSnapshot` on `users/{uid}` throws `permission-denied`. Without the fallback the dashboard always shows 0.

**How to apply:**
- `src/lib/local-profile.ts` — CRUD helpers for localStorage profile data keyed by `ecopulse_profile_{uid}`.
- `src/firebase/provider.tsx` — on `permission-denied`, loads localStorage instead of leaving profile null. On successful Firestore snapshot, calls `mergeFirestoreProfile` to keep localStorage in sync.
- `src/app/calculator/page.tsx` — calls `updateProfileScores` (from `useFirebase()`) BEFORE the batch commit so the dashboard updates immediately whether or not Firestore write succeeds.
- Scores are capped at 99 in `incrementLocalProfile`.
- Initial defaults: `greenPoints: 100`, `sustainabilityScore: 75`.
