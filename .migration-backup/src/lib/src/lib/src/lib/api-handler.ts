import { NextRequest } from 'next/server';
import { getErrorMessage } from '@/lib/handle-error';
import { checkRateLimit } from '@/lib/rate-limiter';
import { verifyAuthToken, AuthError } from '@/lib/verify-auth';
import { logger } from '@/lib/logger';

interface GuardOptions {
  rateLimit: number;
  windowMs: number;
}

function jsonError(message: string, status: number, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
  });
}

export function withApiGuard(
  handler: (req: NextRequest, ctx: { uid: string }) => Promise<Response>,
  options: GuardOptions
) {
  return async function (req: NextRequest): Promise<Response> {
    let uid: string;
    try {
      ({ uid } = await verifyAuthToken(req));
    } catch (error) {
      if (error instanceof AuthError) {
        return jsonError(error.message, error.status);
      }
      return jsonError('Unauthorized', 401);
    }

    const ipHeader = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'anonymous';
    const ip = ipHeader.split(',')[0].trim();
    const rateLimitKey = `${uid}:${ip}`;

    const { allowed } = await checkRateLimit(rateLimitKey, options.rateLimit, options.windowMs);
    if (!allowed) {
      return jsonError('Too many requests. Please wait.', 429, { 'Retry-After': '60' });
    }

    try {
      return await handler(req, { uid });
    } catch (error: unknown) {
      logger.error('[API Route Error]:', error);
      return jsonError(getErrorMessage(error), 500);
    }
  };
}
