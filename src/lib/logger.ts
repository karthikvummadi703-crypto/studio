/**
 * @fileOverview Centralized logging utility for EcoPulse AI.
 */

const isProd = process.env.NODE_ENV === 'production';

/**
 * Environment-aware logger that no-ops in production.
 */
export const logger = {
  log: (...args: any[]): void => {
    if (!isProd) console.log(...args);
  },
  error: (...args: any[]): void => {
    if (!isProd) console.error(...args);
  },
  warn: (...args: any[]): void => {
    if (!isProd) console.warn(...args);
  },
  info: (...args: any[]): void => {
    if (!isProd) console.info(...args);
  },
};
