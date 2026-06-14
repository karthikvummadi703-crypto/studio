/**
 * Client-side session stubs (Vite build — no server-side cookies).
 * The original Next.js version used HttpOnly cookies via server actions.
 * In this Vite SPA, Firebase auth state is the source of truth; these are no-ops.
 */

export async function setSessionCookieAction(_idToken: string): Promise<void> {
  // no-op in Vite SPA
}

export async function clearSessionCookieAction(): Promise<void> {
  // no-op in Vite SPA
}
