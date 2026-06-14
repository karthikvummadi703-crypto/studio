/**
 * @fileOverview Integration tests for POST /api/ai/chat
 * Covers: missing auth → 401, bad prefix → 401, rate-limited → 429,
 *         valid request → 200 streaming, AI failure → fallback text.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../src/app/api/ai/chat/route';
import { NextRequest } from 'next/server';

vi.mock('@/lib/rate-limiter', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true }),
}));

vi.mock('@/ai/flows/ai-advisor-chat', () => ({
  advisorPrompt: vi.fn().mockResolvedValue({
    output: { responseText: 'Use a bike for short trips.', suggestedTitle: 'Cycling' },
  }),
  AIAdvisorChatInputSchema: {
    parse: (v: unknown) => v,
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { log: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { checkRateLimit } from '@/lib/rate-limiter';
import { advisorPrompt } from '@/ai/flows/ai-advisor-chat';

function makeRequest(body: unknown, bearer?: string): NextRequest {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-forwarded-for': '127.0.0.1',
  };
  if (bearer) headers['Authorization'] = `Bearer ${bearer}`;
  return new NextRequest('http://localhost/api/ai/chat', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

const validBody = {
  userInput: 'How do I lower my footprint?',
  history: [],
  userContext: { points: 100, score: 50, level: 'Seedling', challengesCompleted: 1 },
};

describe('POST /api/ai/chat', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when Authorization header is missing', async () => {
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toMatch(/unauthorized/i);
  });

  it('returns 401 when Authorization header lacks Bearer prefix', async () => {
    const req = new NextRequest('http://localhost/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Token abc123',
        'x-forwarded-for': '127.0.0.1',
      },
      body: JSON.stringify(validBody),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 429 with Retry-After header when rate limit exceeded', async () => {
    (checkRateLimit as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ allowed: false });
    const res = await POST(makeRequest(validBody, 'valid-token'));
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('60');
  });

  it('returns 200 streaming response on valid request', async () => {
    const res = await POST(makeRequest(validBody, 'valid-token'));
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/plain');
    const text = await res.text();
    expect(text).toContain('bike');
  });

  it('returns fallback text when AI output is null', async () => {
    (advisorPrompt as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ output: null });
    const res = await POST(makeRequest(validBody, 'valid-token'));
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toMatch(/unable to generate/i);
  });
});
