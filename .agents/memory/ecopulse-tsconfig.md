---
name: EcoPulse tsconfig setup
description: Decisions around the TypeScript config for the ecopulse Vite+React artifact.
---

**Rule:** Test files (*.test.ts, *.test.tsx, __tests__/**, rc/**) are excluded from
`artifacts/ecopulse/tsconfig.json`. A separate `tsconfig.test.json` exists for
dedicated test type-checking.

**Why:** @testing-library/react v16 re-exports via @testing-library/dom; tsc couldn't
resolve those re-exports cleanly. Excluding test files from the main compilation
eliminates this class of false errors while keeping source compilation clean.

**How to apply:** Any new test files added under `src/` are automatically excluded by
the `**/__tests__/**` and `**/*.test.tsx` patterns. Vitest handles type checking at
runtime via tsconfig.test.json.

**`strict: true` note:** tsconfig.base.json has `"strict": true` plus an explicit
`"strictFunctionTypes": false` override. The explicit setting wins, so strictFunctionTypes
remains false to avoid breaking existing callback types across the monorepo.
