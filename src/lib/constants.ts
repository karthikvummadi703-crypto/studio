/**
 * @fileOverview Application-wide constants and magic strings.
 */

export const COLLECTIONS = {
  USERS: 'users',
  CALCULATOR_RECORDS: 'calculator_records',
  CHALLENGE_PROGRESS: 'challenge_progress',
  ACTIVITIES: 'activities',
  AI_CONVERSATIONS: 'ai_conversations',
} as const;

export const AUTH_PROVIDERS = {
  GOOGLE: 'google.com',
} as const;

export const APP_METADATA = {
  NAME: 'EcoPulse AI',
  TAGLINE: 'Environmental Strategy Node',
} as const;
