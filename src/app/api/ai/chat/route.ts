import { ai } from '@/ai/genkit';
import { advisorPrompt, AIAdvisorChatInputSchema } from '@/ai/flows/ai-advisor-chat';
import { NextRequest } from 'next/server';
import { getErrorMessage } from '@/lib/handle-error';

// Sliding window rate limiter
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_THRESHOLD = 15;
const RATE_LIMIT_WINDOW = 60 * 1000;

/**
 * Hardened Streaming API Route for AI Advisor.
 * Implements authentication token verification and rate limiting.
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Missing or invalid token' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Rate Limiting
    const ip = req.headers.get('x-forwarded-for') || req.ip || 'anonymous';
    const now = Date.now();
    const timestamps = rateLimitMap.get(ip) || [];
    const validTimestamps = timestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW);
    
    if (validTimestamps.length >= RATE_LIMIT_THRESHOLD) {
      return new Response(JSON.stringify({ error: 'Too many requests' }), { 
        status: 429,
        headers: { 
          'Content-Type': 'application/json',
          'Retry-After': '60'
        }
      });
    }
    
    validTimestamps.push(now);
    rateLimitMap.set(ip, validTimestamps);

    const input = await req.json();
    const parsedInput = AIAdvisorChatInputSchema.parse(input);

    // Correct Genkit 1.x streaming implementation
    const { stream } = ai.generateStream({
      prompt: advisorPrompt,
      input: parsedInput,
    });

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (chunk.text) {
              controller.enqueue(encoder.encode(chunk.text));
            }
          }
        } catch (err) {
          console.error('[Stream error]:', err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-Content-Type-Options': 'nosniff'
      },
    });
  } catch (error: unknown) {
    console.error('[AI Stream Route Error]:', error);
    return new Response(JSON.stringify({ error: getErrorMessage(error) }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
