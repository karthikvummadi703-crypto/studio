/**
 * @fileOverview POST /api/ai/insights
 *
 * Returns a full AI-generated carbon reduction plan as JSON.
 * Auth:       Bearer token required.
 * Rate limit: 10 requests / 60 s per IP.
 */

import { reductionPlanPrompt, GenerateReductionPlanInputSchema } from '@/ai/flows/generate-reduction-plan';
import { NextRequest } from 'next/server';
import { getErrorMessage } from '@/lib/handle-error';
import { checkRateLimit } from '@/lib/rate-limiter';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const RATE_LIMIT_THRESHOLD = 10;
const RATE_LIMIT_WINDOW = 60 * 1000;

export async function POST(req: NextRequest): Promise<Response> {
  // ── 1. Auth check ──────────────────────────────────────────────────────────
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Missing or invalid token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // ── 2. Rate limiting ───────────────────────────────────────────────────────
  const ipHeader = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'anonymous';
  const ip = ipHeader.split(',')[0].trim();

  const { allowed } = await checkRateLimit(ip, RATE_LIMIT_THRESHOLD, RATE_LIMIT_WINDOW);
  if (!allowed) {
    return new Response(JSON.stringify({ error: 'Too many requests. Please wait.' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json', 'Retry-After': '60' },
    });
  }

  // ── 3. Parse & validate input ──────────────────────────────────────────────
  let parsedInput: ReturnType<typeof GenerateReductionPlanInputSchema.parse>;
  try {
    const body = await req.json();
    parsedInput = GenerateReductionPlanInputSchema.parse(body);
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Invalid request body.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // ── 4. Generate & return insights ──────────────────────────────────────────
  try {
    const response = await reductionPlanPrompt(parsedInput);

    if (!response?.output) {
      throw new Error('AI failed to generate insights — empty output.');
    }

    return new Response(JSON.stringify(response.output), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    logger.error('[AI Insights Error]:', error);
    return new Response(JSON.stringify({ error: getErrorMessage(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
