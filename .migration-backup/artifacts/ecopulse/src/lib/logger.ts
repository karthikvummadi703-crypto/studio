/**
 * @fileOverview Environment-aware structured logger for EcoPulse AI.
 *
 * Behaviour by environment:
 *   - test:        all output suppressed so test runs stay clean.
 *   - production:  only warn and error are emitted.
 *   - development: all levels emitted with a clear [EcoPulse] prefix.
 *
 * Usage:
 *   import { logger } from '@/lib/logger';
 *   logger.info('Dashboard loaded', { userId });
 *   logger.error('[ChatRoute] Stream failed', error);
 */

type LogLevel = 'log' | 'info' | 'warn' | 'error';

const env = process.env.NODE_ENV;
const isTest = env === 'test';
const isProd = env === 'production';

function emit(level: LogLevel, prefix: string, args: unknown[]): void {
  if (isTest) return;
  if (isProd && (level === 'log' || level === 'info')) return;
  // eslint-disable-next-line no-console
  console[level](prefix, ...args);
}

export const logger = {
  /** Debug messages. Suppressed in production and test. */
  log:   (...args: unknown[]): void => emit('log',   '[EcoPulse]',       args),
  /** Informational messages. Suppressed in production and test. */
  info:  (...args: unknown[]): void => emit('info',  '[EcoPulse]',       args),
  /** Warnings. Suppressed in test only. */
  warn:  (...args: unknown[]): void => emit('warn',  '[EcoPulse Warn]',  args),
  /** Errors. Suppressed in test only. */
  error: (...args: unknown[]): void => emit('error', '[EcoPulse Error]', args),
};
