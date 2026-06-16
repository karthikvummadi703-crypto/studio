/**
 * @fileOverview Shared error-handling utilities for EcoPulse AI.
 */

/**
 * Safely extracts a human-readable message from any thrown value.
 *
 * @param error - Any value caught in a try/catch block.
 * @returns       A string safe for logging or displaying to the user.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string' && error.length > 0) return error;
  return 'An unexpected error occurred.';
}

/**
 * Type guard — narrows `unknown` to `Error`.
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}
