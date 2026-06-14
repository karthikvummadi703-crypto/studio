import { describe, it, expect } from 'vitest';
import { getErrorMessage, isError } from '../src/lib/handle-error';

describe('getErrorMessage', () => {
  it('returns the message of a standard Error', () =>
    expect(getErrorMessage(new Error('boom'))).toBe('boom'));

  it('returns a non-empty string error as-is', () =>
    expect(getErrorMessage('network issue')).toBe('network issue'));

  it('returns fallback for null', () =>
    expect(getErrorMessage(null)).toBe('An unexpected error occurred.'));

  it('returns fallback for a number', () =>
    expect(getErrorMessage(42)).toBe('An unexpected error occurred.'));

  it('returns fallback for empty string', () =>
    expect(getErrorMessage('')).toBe('An unexpected error occurred.'));

  it('returns fallback for undefined', () =>
    expect(getErrorMessage(undefined)).toBe('An unexpected error occurred.'));
});

describe('isError', () => {
  it('returns true for Error instances', () =>
    expect(isError(new Error('x'))).toBe(true));

  it('returns false for strings', () =>
    expect(isError('string')).toBe(false));

  it('returns false for null', () =>
    expect(isError(null)).toBe(false));
});
