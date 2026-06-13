/**
 * @fileOverview Distributed rate limiter using Firestore atomic transactions.
 *
 * SERVER-SIDE ONLY. The Firestore `rate_limits` collection is locked to all
 * client access in security rules — this must only run in API routes or
 * Server Actions.
 *
 * Design: sliding-window log per IP.
 * Failure policy:
 *   - First transient error → fail OPEN (allow) and log a warning.
 *   - Subsequent errors for the same IP → fail CLOSED (deny) to prevent
 *     an outage from being used as a bypass vector.
 */

import { db } from '@/firebase';
import { doc, runTransaction } from 'firebase/firestore';

const MAX_STORED_TIMESTAMPS = 200;
const FAIL_OPEN_MAX_CONSECUTIVE = 1;

/** Per-IP consecutive error counter. Resets to 0 on any successful transaction. */
const consecutiveErrors = new Map<string, number>();

/**
 * Checks whether the given IP is within its rate limit.
 *
 * @param ip       - Client IP address.
 * @param limit    - Maximum requests allowed within the window.
 * @param windowMs - Window duration in milliseconds.
 * @returns          { allowed: true } if the request may proceed.
 */
export async function checkRateLimit(
  ip: string,
  limit: number,
  windowMs: number
): Promise<{ allowed: boolean }> {
  if (!db) return { allowed: true };

  const limitRef = doc(db, 'rate_limits', ip);
  const now = Date.now();

  try {
    const result = await runTransaction(db, async (transaction) => {
      const docSnap = await transaction.get(limitRef);

      let timestamps: number[] = [];
      if (docSnap.exists()) {
        const data = docSnap.data();
        timestamps = (data.timestamps as number[] ?? [])
          .filter((ts) => now - ts < windowMs)
          .slice(-MAX_STORED_TIMESTAMPS);
      }

      if (timestamps.length >= limit) {
        return { allowed: false };
      }

      timestamps.push(now);
      transaction.set(limitRef, { timestamps, lastSeen: now }, { merge: true });
      return { allowed: true };
    });

    consecutiveErrors.delete(ip);
    return result;
  } catch (error) {
    const count = (consecutiveErrors.get(ip) ?? 0) + 1;
    consecutiveErrors.set(ip, count);

    console.error(`[RateLimiter] Transaction error #${count} for ip=${ip}:`, error);

    if (count > FAIL_OPEN_MAX_CONSECUTIVE) {
      console.error('[RateLimiter] Persistent errors — failing CLOSED.');
      return { allowed: false };
    }

    return { allowed: true };
  }
}
