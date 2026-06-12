import { db } from '@/firebase';
import { doc, runTransaction } from 'firebase/firestore';

/**
 * Distributed rate limiter using Firestore transactions.
 * Ensures consistent rate limiting across multiple server instances.
 * 
 * @param ip The IP address to rate limit.
 * @param limit Maximum number of requests allowed in the window.
 * @param windowMs The time window in milliseconds.
 * @returns Object indicating if the request is allowed.
 */
export async function checkRateLimit(ip: string, limit: number, windowMs: number): Promise<{ allowed: boolean }> {
  if (!db) return { allowed: true };

  const limitRef = doc(db, 'rate_limits', ip);
  const now = Date.now();

  try {
    const result = await runTransaction(db, async (transaction) => {
      const docSnap = await transaction.get(limitRef);
      
      let timestamps: number[] = [];
      if (docSnap.exists()) {
        const data = docSnap.data();
        // Filter out expired timestamps
        timestamps = (data.timestamps || []).filter((ts: number) => now - ts < windowMs);
      }
      
      if (timestamps.length >= limit) {
        return { allowed: false };
      }
      
      timestamps.push(now);
      transaction.set(limitRef, { timestamps }, { merge: true });
      return { allowed: true };
    });
    
    return result;
  } catch (error) {
    // In case of transaction failure (e.g., high contention), we log and fail open 
    // to prevent blocking legitimate traffic in a prototype environment.
    console.error('[RateLimiter] Error:', error);
    return { allowed: true };
  }
}
