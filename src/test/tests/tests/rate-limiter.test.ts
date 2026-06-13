/**
 * @fileOverview Unit tests for the distributed rate limiter.
 * Covers: allow under limit, block at limit, fail-open, fail-closed.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/firebase', () => ({ db: {} }));
vi.mock('firebase/firestore', () => ({
  doc:            vi.fn(() => ({ path: 'rate_limits/127.0.0.1' })),
  runTransaction: vi.fn(),
}));

import { checkRateLimit } from '../src/lib/rate-limiter';
import { runTransaction } from 'firebase/firestore';

function makeTransaction(timestamps: number[]) {
  return (runTransaction as ReturnType<typeof vi.fn>).mockImplementationOnce(
    async (_db: unknown, fn: Function) =>
      fn({
        get: vi.fn().mockResolvedValue({
          exists: () => true,
          data:   () => ({ timestamps }),
        }),
        set: vi.fn(),
      })
  );
}

describe('checkRateLimit', () => {
  beforeEach(() => vi.clearAllMocks());

  it('allows a request when under the limit', async () => {
    makeTransaction([Date.now() - 1000]);
    expect((await checkRateLimit('1.1.1.1', 5, 60_000)).allowed).toBe(true);
  });

  it('blocks a request when at the limit', async () => {
    const full = Array.from({ length: 5 }, (_, i) => Date.now() - i * 100);
    makeTransaction(full);
    expect((await checkRateLimit('1.1.1.2', 5, 60_000)).allowed).toBe(false);
  });

  it('allows when doc does not exist yet', async () => {
    (runTransaction as ReturnType<typeof vi.fn>).mockImplementationOnce(
      async (_db: unknown, fn: Function) =>
        fn({
          get: vi.fn().mockResolvedValue({ exists: () => false }),
          set: vi.fn(),
        })
    );
    expect((await checkRateLimit('1.1.1.3', 5, 60_000)).allowed).toBe(true);
  });

  it('expires old timestamps outside the window', async () => {
    const old = Array.from({ length: 5 }, (_, i) => Date.now() - 70_000 - i);
    makeTransaction(old);
    expect((await checkRateLimit('1.1.1.4', 5, 60_000)).allowed).toBe(true);
  });

  it('fails open on first transaction error', async () => {
    (runTransaction as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('blip'));
    expect((await checkRateLimit('2.2.2.1', 5, 60_000)).allowed).toBe(true);
  });

  it('fails CLOSED on second consecutive error for same IP', async () => {
    (runTransaction as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('persistent'));
    await checkRateLimit('2.2.2.2', 5, 60_000); // first — open
    expect((await checkRateLimit('2.2.2.2', 5, 60_000)).allowed).toBe(false);
  });
});
