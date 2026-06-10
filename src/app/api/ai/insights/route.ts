import { ai } from '@/ai/genkit';
import { generateReductionPlanFlow } from '@/ai/flows/generate-reduction-plan';
import { NextRequest } from 'next/server';

/**
 * Streaming API Route for AI Environmental Insights.
 * Implements Bearer token authentication check for security.
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

    const input = await req.json();

    const { stream } = ai.generateStream({
      flow: generateReductionPlanFlow,
      input,
    });

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          if (chunk.output) {
            controller.enqueue(encoder.encode(JSON.stringify(chunk.output)));
          }
        }
        controller.close();
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-Content-Type-Options': 'nosniff'
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
