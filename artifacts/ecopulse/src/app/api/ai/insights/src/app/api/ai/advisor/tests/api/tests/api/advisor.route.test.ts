import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/verify-auth', () => ({
  verifyAuthToken: vi.fn(),
  AuthError: class AuthError extends Error {
    status: number;
    constructor(message: string, status = 401) { super(message); this.status = status; }
  },
}));

vi.mock('@/lib/rate-limiter', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true }),
}));

vi.mock('@/ai/flows/ai-advisor-chat', () => ({
  AIAdvisorChatInputSchema: { parse: (x: unknown) => x },
  advisorPrompt: vi.fn().mockResolvedValue({ output: { responseText: 'Hello, here is advice.' } }),
}));

import { POST } from '@/app/api/ai/advisor/route';
import { verifyAuthToken, AuthError } from '@/lib/verify-auth';
import { checkRateLimit } from '@/lib/rate-limiter';

function makeReq(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost/api/ai/advisor', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

describe('POST /api/ai/advisor', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when Authorization header is missing', async () => {
    (verifyAuthToken as any).mockRejectedValue(new AuthError('Unauthorized: Missing or invalid token'));
    const res = await POST(makeReq({ message: 'hi' }));
    expect(res.status).toBe(401);
  });

  it('returns 429 when rate limited', async () => {
    (verifyAuthToken as any).mockResolvedValue({ uid: 'user-1' });
    (checkRateLimit as any).mockResolvedValue({ allowed: false });
    const res = await POST(makeReq({ message: 'hi' }, { Authorization: 'Bearer good-token' }));
    expect(res.status).toBe(429);
  });

  it('returns the advisor responseText as plain text on success', async () => {
    (verifyAuthToken as any).mockResolvedValue({ uid: 'user-1' });
    (checkRateLimit as any).mockResolvedValue({ allowed: true });
    const res = await POST(makeReq({ message: 'hi' }, { Authorization: 'Bearer good-token' }));
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/plain');
    const text = await res.text();
    expect(text).toBe('Hello, here is advice.');
  });
});
