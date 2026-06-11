/**
 * @fileOverview Shared error handling utilities for the EcoPulse AI application.
 */

/**
 * Safely extracts a message from an unknown error object.
 * @param error The error object caught in a try/catch block.
 * @returns A string representation of the error message.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  if (typeof error === 'string') return error;
  return 'An unexpected error occurred.';
}
