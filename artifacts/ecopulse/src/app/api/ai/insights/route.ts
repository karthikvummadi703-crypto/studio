/**
 * @fileOverview POST /api/ai/insights
 * Auth: verified Firebase ID token. Rate limit: 10/60s per uid+IP.
 */
import { reductionPlanPrompt, GenerateReductionPlanInputSchema } from '@/ai/flows/generate-reduction-plan';
import { NextRequest } from 'next/server';
import { withApiGuard } from '@/lib/api-handler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = withApiGuard(
  async (req: NextRequest) => {
    let parsedInput: ReturnType<typeof GenerateReductionPlanInputSchema.parse>;
    try {
      const body = await req.json();
      parsedInput = GenerateReductionPlanInputSchema.parse(body);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid request body.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const response = await reductionPlanPrompt(parsedInput);
    if (!response?.output) {
      throw new Error('AI failed to generate insights — empty output.');
    }

    return new Response(JSON.stringify(response.output), {
      headers: { 'Content-Type': 'application/json' },
    });
  },
  { rateLimit: 10, windowMs: 60 * 1000 }
);
