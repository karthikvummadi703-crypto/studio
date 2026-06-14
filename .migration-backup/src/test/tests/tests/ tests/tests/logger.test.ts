/**
 * @fileOverview Tests for the environment-aware logger.
 * NODE_ENV=test causes all output to be suppressed — verified here.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';

describe('logger — test environment', () => {
  afterEach(() => vi.restoreAllMocks());

  it('suppresses all log levels in test environment', async () => {
    const spies = {
      log:   vi.spyOn(console, 'log').mockImplementation(() => {}),
      info:  vi.spyOn(console, 'info').mockImplementation(() => {}),
      warn:  vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    };

    const { logger } = await import('../src/lib/logger');
    logger.log('debug');
    logger.info('info');
    logger.warn('warning');
    logger.error('error');

    expect(spies.log).not.toHaveBeenCalled();
    expect(spies.info).not.toHaveBeenCalled();
    expect(spies.warn).not.toHaveBeenCalled();
    expect(spies.error).not.toHaveBeenCalled();
  });
});
