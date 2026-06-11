/**
 * @fileOverview User-safe mapping for Firebase Authentication error codes.
 */

const FIREBASE_ERROR_MAP: Record<string, string> = {
  'auth/wrong-password': 'Invalid email or password.',
  'auth/user-not-found': 'Invalid email or password.',
  'auth/invalid-credential': 'Invalid email or password.',
  'auth/email-already-in-use': 'This email is already registered.',
  'auth/weak-password': 'The password is too weak.',
  'auth/too-many-requests': 'Too many attempts. Please try again later.',
  'auth/network-request-failed': 'Network error. Please check your connection.',
  'auth/operation-not-allowed': 'This sign-in method is currently disabled.',
};

/**
 * Translates a Firebase Auth error code into a human-readable message.
 * @param code The error code string from Firebase.
 * @returns A safe, descriptive error message.
 */
export function getAuthErrorMessage(code: string): string {
  return FIREBASE_ERROR_MAP[code] ?? 'Authentication failed. Please try again.';
}