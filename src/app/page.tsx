"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { Loader2, Leaf } from 'lucide-react';

export default function RootPage() {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || isLoading) return;

    if (user) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [user, isLoading, router, mounted]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] bg-transparent relative z-50">
      <div className="flex flex-col items-center gap-6 p-10 bg-white/40 backdrop-blur-2xl rounded-[3rem] shadow-2xl border border-white/20">
        <div className="p-4 bg-primary/10 rounded-[2rem] ring-8 ring-primary/5">
          <Leaf className="h-12 w-12 text-primary" />
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-headline font-bold text-foreground">EcoPulse AI</h1>
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.3em]">Synchronizing Environment...</p>
        </div>
        <Loader2 className="h-6 w-6 text-primary animate-spin" />
      </div>
    </div>
  );
}
