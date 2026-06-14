/**
 * @fileOverview Integration tests for POST /api/ai/insights
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../src/app/api/ai/insights/route';
import { NextRequest } from 'next/server';

vi.mock('@/lib/rate-limiter', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true }),
}));

vi.mock('@/ai/flows/generate-reduction-plan', () => ({
  reductionPlanPrompt: vi.fn().mockResolvedValue({
    output: {
      personalizedAnalysis: 'High transport emissions.',
      weeklyActionPlan: 'Walk on Mondays.',
      monthlyImprovementStrategy: 'Switch to EV.',
      transportationRecommendations: [],
      homeEnergyRecommendations: [],
      foodRecommendations: [],
      lifestyleRecommendations: [],
    },
  }),
  GenerateReductionPlanInputSchema: { parse: (v: unknown) => v },
}));

vi.mock('@/lib/logger', () => ({
  logger: { log: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { checkRateLimit } from '@/lib/rate-limiter';
import { reductionPlanPrompt } from '@/ai/flows/generate-reduction-plan';

function makeRequest(body: unknown, bearer?: string): NextRequest {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-forwarded-for': '10.0.0.1',
  };
  if (bearer) headers['Authorization'] = `Bearer ${bearer}`;
  return new NextRequest('http://localhost/api/ai/insights', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

const validBody = {
  totalEmissions: 10,
  emissionsBreakdown: { transportation: 4, homeEnergy: 3, food: 2, lifestyle: 1 },
};

describe('POST /api/ai/insights', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when Authorization header is missing', async () => {
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(401);
  });

  it('returns 429 when rate limit is exceeded', async () => {
    (checkRateLimit as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ allowed: false });
    const res = await POST(makeRequest(validBody, 'tok'));
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('60');
  });

  it('returns 200 with valid JSON body on success', async () => {
    const res = await POST(makeRequest(validBody, 'tok'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.personalizedAnalysis).toBeDefined();
    expect(json.weeklyActionPlan).toBeDefined();
  });

  it('returns 500 when AI returns null output', async () => {
    (reductionPlanPrompt as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ output: null });
    const res = await POST(makeRequest(validBody, 'tok'));
    expect(res.status).toBe(500);
  });

  it('returns 400 on invalid body schema', async () => {
    // Override parse to throw as Zod would
    const { GenerateReductionPlanInputSchema } = await import('@/ai/flows/generate-reduction-plan');
    vi.spyOn(GenerateReductionPlanInputSchema, 'parse').mockImplementationOnce(() => {
      throw new Error('Invalid input');
    });
    const res = await POST(makeRequest({ bad: 'data' }, 'tok'));
    expect(res.status).toBe(400);
  });
});
