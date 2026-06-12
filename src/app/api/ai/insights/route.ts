import { ai } from '@/ai/genkit';
import { generateReductionPlanFlow } from '@/ai/flows/generate-reduction-plan';
import { NextRequest } from 'next/server';
import { getErrorMessage } from '@/lib/handle-error';
import { checkRateLimit } from '@/lib/rate-limiter';

const RATE_LIMIT_THRESHOLD = 10;
const RATE_LIMIT_WINDOW = 60 * 1000;

/**
 * Streaming API Route for AI Environmental Insights.
 * Protected with Bearer token check and distributed rate limiting.
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Missing or invalid token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Distributed Rate Limiting via Firestore
    // Robust IP extraction to avoid TypeScript errors and support different proxies (e.g. Netlify/Vercel)
    const ipHeader = req.headers.get('x-forwarded-for') ?? req.headers.get('x-nf-client-connection-ip') ?? '';
    const ip = ipHeader.split(',')[0].trim() || 'anonymous';

    const { allowed } = await checkRateLimit(ip, RATE_LIMIT_THRESHOLD, RATE_LIMIT_WINDOW);

    if (!allowed) {
      return new Response(JSON.stringify({ error: 'Too many requests' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', 'Retry-After': '60' },
      });
    }

    const input = await req.json();

    const { stream } = ai.generateStream({
      flow: generateReductionPlanFlow,
      input,
    });

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (chunk.output) {
              controller.enqueue(encoder.encode(JSON.stringify(chunk.output)));
            }
          }
        } catch (err) {
          console.error('[Insights stream error]:', err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error: unknown) {
    console.error('[AI Insights Error]:', error);
    return new Response(JSON.stringify({ error: getErrorMessage(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
