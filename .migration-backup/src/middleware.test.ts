import { describe, it, expect } from 'vitest';
import { middleware } from './middleware';
import { NextRequest } from 'next/server';

/**
 * Helper to create a NextRequest object for testing.
 * @param pathname The URL path to request.
 * @param cookie Optional session token cookie value.
 */
function makeRequest(pathname: string, cookie?: string) {
  const req = new NextRequest(new URL(`http://localhost${pathname}`));
  if (cookie) {
    req.cookies.set('__session', cookie);
  }
  return req;
}

describe('middleware', () => {
  it('redirects unauthenticated users from /dashboard to /login', () => {
    const req = makeRequest('/dashboard');
    const res = middleware(req);
    
    // Check for redirect status (307 is default for NextResponse.redirect)
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/login');
    // Verify it includes the original path as a return parameter
    expect(res.headers.get('location')).toContain('from=%2Fdashboard');
  });

  it('allows authenticated users to access /dashboard', () => {
    const req = makeRequest('/dashboard', 'valid-session-token');
    const res = middleware(req);
    
    // NextResponse.next() doesn't set a redirect location
    expect(res.headers.get('location')).toBeNull();
  });

  it('redirects authenticated users away from /login to /dashboard', () => {
    const req = makeRequest('/login', 'valid-session-token');
    const res = middleware(req);
    
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/dashboard');
  });

  it('allows unauthenticated users to access /login', () => {
    const req = makeRequest('/login');
    const res = middleware(req);
    
    expect(res.headers.get('location')).toBeNull();
  });

  it('allows unauthenticated users to access /register', () => {
    const req = makeRequest('/register');
    const res = middleware(req);
    
    expect(res.headers.get('location')).toBeNull();
  });

  it('protects sub-routes of /dashboard', () => {
    const req = makeRequest('/dashboard/settings');
    const res = middleware(req);
    
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/login');
  });
});
