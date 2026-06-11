'use server';

import { cookies } from 'next/headers';

/**
 * Sets the session cookie server-side with HttpOnly flag for security.
 * @param idToken The Firebase ID token to store.
 */
export async function setSessionCookieAction(idToken: string) {
  const cookieStore = await cookies();
  cookieStore.set('__session', idToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 3600,
    path: '/',
  });
}

/**
 * Clears the session cookie server-side.
 */
export async function clearSessionCookieAction() {
  const cookieStore = await cookies();
  cookieStore.delete('__session');
}
