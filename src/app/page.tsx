
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { Loader2, Leaf } from 'lucide-react';

/**
 * Root page with intelligent Auth redirection.
 * Ensures the preview lands on /login if no session is active.
 */
export default function RootPage() {
  const router = useRouter();
  const { user, isLoading } = useUser();

  useEffect(() => {
    if (isLoading) return;

    if (user) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center gap-6 animate-pulse">
        <div className="p-4 bg-primary/10 rounded-[2rem] ring-8 ring-primary/5">
          <Leaf className="h-12 w-12 text-primary" />
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-headline font-bold text-foreground">EcoPulse AI</h1>
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.3em]">Authenticating Node...</p>
        </div>
        <Loader2 className="h-6 w-6 text-primary animate-spin" />
      </div>
    </div>
  );
}
