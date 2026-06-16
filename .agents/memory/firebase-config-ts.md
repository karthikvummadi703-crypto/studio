---
name: Firebase config TS export
description: Why firebase/config.ts uses @ts-ignore instead of @ts-expect-error for the app/auth/db export.
---

## Rule
Use `// @ts-ignore` (not `// @ts-expect-error`) for the `export { app, auth, db }` line at the bottom of `src/firebase/config.ts`.

**Why:** `@ts-expect-error` requires an actual TypeScript error on the next line. When Firebase credentials are configured (all VITE_FIREBASE_* secrets present), TypeScript no longer sees an error on that export, making `@ts-expect-error` itself an error ("Unused '@ts-expect-error' directive"). `@ts-ignore` suppresses silently regardless.
