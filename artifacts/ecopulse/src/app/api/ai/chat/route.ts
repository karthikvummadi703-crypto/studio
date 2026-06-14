/**
 * @fileOverview POST /api/ai/chat
 * Auth: verified Firebase ID token. Rate limit: 15 req/60s per IP.
 * Unified with withApiGuard for consistent auth + error handling.
 */
import { advisorPrompt, AIAdvisorChatInputSchema } from '@/ai/flows/ai-advisor-chat';
import { NextRequest } from 'next/server';
import { withApiGuard } from '@/lib/api-handler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = withApiGuard(
  async (req: NextRequest) => {
    let parsedInput: ReturnType<typeof AIAdvisorChatInputSchema.parse>;
    try {
      const body = await req.json();
      parsedInput = AIAdvisorChatInputSchema.parse(body);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid request body.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const response = await advisorPrompt(parsedInput);
    if (!response?.output) {
      throw new Error('AI failed to generate a response — empty output.');
    }

    return new Response(response.output.responseText, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  },
  { rateLimit: 15, windowMs: 60 * 1000 }
);
