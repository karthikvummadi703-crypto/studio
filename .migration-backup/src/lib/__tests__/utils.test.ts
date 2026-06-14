import { describe, it, expect } from 'vitest';
import { cn } from '../utils';
import { getLevelFromPoints } from '../levels';
import { getErrorMessage } from '../handle-error';
import { getAuthErrorMessage } from '../auth-errors';

describe('Library Utilities', () => {
  describe('cn() - Class Name Merger', () => {
    it('merges multiple class names', () => {
      expect(cn('a', 'b')).toBe('a b');
    });

    it('resolves Tailwind CSS conflicts', () => {
      // twMerge resolves p-2 vs p-4 conflict
      expect(cn('p-2', 'p-4')).toBe('p-4');
      expect(cn('px-2 py-2', 'px-4')).toBe('py-2 px-4');
    });

    it('filters out falsy values', () => {
      expect(cn('base', false && 'hidden', true && 'active', null, undefined)).toBe('base active');
    });
  });

  describe('getLevelFromPoints() - Gamification Logic', () => {
    it('correctly maps points to environmental levels', () => {
      expect(getLevelFromPoints(0)).toBe('Seedling');
      expect(getLevelFromPoints(100)).toBe('Seedling');
      expect(getLevelFromPoints(101)).toBe('Eco Warrior');
      expect(getLevelFromPoints(500)).toBe('Eco Warrior');
      expect(getLevelFromPoints(501)).toBe('Climate Champion');
      expect(getLevelFromPoints(1000)).toBe('Climate Champion');
      expect(getLevelFromPoints(1001)).toBe('Planet Guardian');
    });
  });

  describe('getErrorMessage() - Generic Error Handling', () => {
    it('extracts message from standard Error objects', () => {
      expect(getErrorMessage(new Error('telemetry sync failure'))).toBe('telemetry sync failure');
    });

    it('returns a standard fallback for non-Error types', () => {
      expect(getErrorMessage('raw string')).toBe('An unexpected error occurred.');
      expect(getErrorMessage(null)).toBe('An unexpected error occurred.');
    });
  });

  describe('getAuthErrorMessage() - Secure Auth Messaging', () => {
    it('translates Firebase error codes to secure user-safe strings', () => {
      expect(getAuthErrorMessage('auth/wrong-password')).toBe('Invalid email or password.');
      expect(getAuthErrorMessage('auth/user-not-found')).toBe('Invalid email or password.');
      expect(getAuthErrorMessage('auth/too-many-requests')).toBe('Too many attempts. Please try again later.');
    });

    it('provides a safe fallback for unknown auth codes', () => {
      expect(getAuthErrorMessage('auth/unknown-error-code')).toBe('Authentication failed. Please try again.');
    });
  });
});
