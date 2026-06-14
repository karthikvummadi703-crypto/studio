import { advisorPrompt, AIAdvisorChatInputSchema } from '@/ai/flows/ai-advisor-chat';
import { NextRequest } from 'next/server';
import { withApiGuard } from '@/lib/api-handler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = withApiGuard(
  async (req: NextRequest) => {
    const input = await req.json();
    const parsedInput = AIAdvisorChatInputSchema.parse(input);

    const response = await advisorPrompt(parsedInput);
    if (!response || !response.output) {
      throw new Error('AI failed to generate a response');
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
