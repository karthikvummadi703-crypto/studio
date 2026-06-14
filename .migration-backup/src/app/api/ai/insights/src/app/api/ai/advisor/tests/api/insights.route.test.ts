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

vi.mock('@/ai/flows/generate-reduction-plan', () => ({
  GenerateReductionPlanInputSchema: { parse: (x: unknown) => x },
  reductionPlanPrompt: vi.fn().mockResolvedValue({ output: { plan: 'reduce emissions' } }),
}));

import { POST } from '@/app/api/ai/insights/route';
import { verifyAuthToken, AuthError } from '@/lib/verify-auth';
import { checkRateLimit } from '@/lib/rate-limiter';

function makeReq(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost/api/ai/insights', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

describe('POST /api/ai/insights', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when no Authorization header', async () => {
    (verifyAuthToken as any).mockRejectedValue(new AuthError('Unauthorized: Missing or invalid token'));
    const res = await POST(makeReq({}));
    expect(res.status).toBe(401);
  });

  it('returns 401 for an invalid/expired token', async () => {
    (verifyAuthToken as any).mockRejectedValue(new AuthError('Unauthorized: Invalid or expired token'));
    const res = await POST(makeReq({}, { Authorization: 'Bearer bad-token' }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toMatch(/Invalid or expired token/);
  });

  it('returns 429 when rate limited', async () => {
    (verifyAuthToken as any).mockResolvedValue({ uid: 'user-1' });
    (checkRateLimit as any).mockResolvedValue({ allowed: false });
    const res = await POST(makeReq({}, { Authorization: 'Bearer good-token' }));
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('60');
  });

  it('returns 400 for an invalid body', async () => {
    (verifyAuthToken as any).mockResolvedValue({ uid: 'user-1' });
    (checkRateLimit as any).mockResolvedValue({ allowed: true });
    const req = new NextRequest('http://localhost/api/ai/insights', {
      method: 'POST',
      body: '{not json',
      headers: { Authorization: 'Bearer good-token', 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 200 with the generated plan on success', async () => {
    (verifyAuthToken as any).mockResolvedValue({ uid: 'user-1' });
    (checkRateLimit as any).mockResolvedValue({ allowed: true });
    const res = await POST(makeReq({ profile: 'test' }, { Authorization: 'Bearer good-token' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.plan).toBe('reduce emissions');
  });
});
