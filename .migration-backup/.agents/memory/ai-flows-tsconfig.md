---
name: AI flows tsconfig exclusion
description: Server-side genkit flow files must be excluded from the frontend tsconfig.
---

## Rule
These files live under `src/ai/flows/` but are server-side genkit code and must be excluded from `artifacts/ecopulse/tsconfig.json`:
- `src/ai/genkit.ts`
- `src/ai/flows/ai-advisor-chat.ts`
- `src/ai/flows/generate-carbon-analysis.ts`
- `src/ai/flows/generate-reduction-plan.ts`
- `src/ai/flows/index.ts`

`src/ai/flows/types.ts` is safe to include — it only exports TypeScript interfaces with no genkit imports.

**Why:** These files import from `genkit` and `@genkit-ai/google-genai` which are installed only in the API server package, not the frontend. Including them in the frontend tsconfig causes "Cannot find module 'genkit'" errors.
