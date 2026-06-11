'use client';

import { FlaskConical, X, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { signOut } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { useRouter } from 'next/navigation';
import { IS_DEMO_KEY } from '@/lib/constants';
import { clearSessionCookieAction } from '@/app/actions/session';

/**
 * Sticky banner shown at the top of every app page for demo users.
 * Provides clear path to register or exit demo.
 */
export function DemoBanner() {
  const auth = useAuth();
  const router = useRouter();

  const handleExitDemo = async () => {
    sessionStorage.removeItem(IS_DEMO_KEY);
    await clearSessionCookieAction();
    if (auth) await signOut(auth);
    router.push('/login');
  };

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Demo mode is active"
      className="w-full bg-primary text-white px-4 py-2.5 flex items-center justify-between gap-4 shrink-0 z-40"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <FlaskConical className="h-4 w-4 shrink-0" aria-hidden="true" />
        <p className="text-xs font-bold truncate">
          You're in <span className="uppercase tracking-widest">Demo Mode</span>
          <span className="hidden sm:inline"> — data is pre-filled and not saved</span>
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Link
          href="/register"
          className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest bg-white text-primary px-3 py-1.5 rounded-lg hover:bg-white/90 transition-colors focus-visible:ring-2 focus-visible:ring-white outline-none"
          aria-label="Register for a free account"
        >
          <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
          Register Free
        </Link>
        <button
          onClick={handleExitDemo}
          aria-label="Exit demo mode"
          className="p-1.5 hover:bg-white/20 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-white outline-none"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
