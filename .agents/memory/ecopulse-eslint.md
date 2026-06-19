---
name: EcoPulse ESLint setup
description: ESLint flat config details for the ecopulse artifact.
---

**Rule:** ESLint is configured at `artifacts/ecopulse/eslint.config.mjs` using the
flat-config format (ESLint v10). The binary lives in the workspace root
`node_modules/.bin/eslint`, NOT in ecopulse's own node_modules.

**Why:** ESLint was installed as a workspace root devDependency. Running
`bash ../../node_modules/.bin/eslint src/` from inside the ecopulse directory is the
correct invocation. The `lint` script in package.json uses this path.

**How to apply:** Run `pnpm --filter @workspace/ecopulse run lint` or from ecopulse dir:
`bash ../../node_modules/.bin/eslint src/`.

**Key rule settings:**
- `@typescript-eslint/no-unused-vars` with argsIgnorePattern, varsIgnorePattern,
  AND `caughtErrorsIgnorePattern` all set to `"^_"`.
- `react-hooks/exhaustive-deps` is "warn" (intentional dep omissions use eslint-disable).
- `no-console` is NOT in the config — logger.ts wraps console; don't re-add it.
- UI components in `src/components/ui/**` are ignored (shadcn generated code).
