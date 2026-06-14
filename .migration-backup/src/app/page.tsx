
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { Leaf } from 'lucide-react';
import { Spinner } from '@/components/ui';

/**
 * Root page redirector. Ensures Login is the entry point for guests.
 */
export default function RootPage() {
  const router = useRouter();
  const { user, isLoading } = useUser();

  useEffect(() => {
    if (isLoading) return;
    // Strict Workflow: Login First, Dashboard only if Authenticated
    router.replace(user ? '/dashboard' : '/login');
  }, [user, isLoading, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-4 p-8 bg-white rounded-3xl shadow-lg border border-zinc-100">
        <div className="p-3 bg-primary/10 rounded-2xl">
          <Leaf className="h-10 w-10 text-primary" />
        </div>
        <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">Initialising Node...</p>
        <Spinner className="h-5 w-5 text-primary" label="Initializing environment node..." />
      </div>
    </div>
  );
}
