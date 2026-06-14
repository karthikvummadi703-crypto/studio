import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Singleton Genkit instance optimized for speed and efficiency.
 * Includes a simple module-level response cache to minimize redundant LLM calls.
 */
export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-1.5-flash',
});

// Simple session-level response cache
const responseCache = new Map<string, any>();

/**
 * Wraps a flow execution with a simple memory cache.
 * @param key Unique key for the prompt/input.
 * @param fn The async function to execute if cache miss.
 */
export async function withCache<T>(key: string, fn: () => Promise<T>): Promise<T> {
  if (responseCache.has(key)) {
    return responseCache.get(key);
  }
  const result = await fn();
  responseCache.set(key, result);
  return result;
}
