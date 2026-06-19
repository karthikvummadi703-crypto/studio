// Client-side stubs — Firebase auth state is source of truth. No server-side cookies in this Vite SPA.
export async function setSessionCookieAction(_idToken: string): Promise<void> {}
export async function clearSessionCookieAction(): Promise<void> {}
