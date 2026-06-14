import Link from 'next/link';
import { Leaf, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Custom 404 page matching EcoPulse design system.
 */
export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] gap-8 text-center p-8">
      <div className="p-5 bg-primary/10 rounded-[2rem] ring-8 ring-primary/5">
        <Leaf className="h-12 w-12 text-primary" />
      </div>
      <div className="space-y-3">
        <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">404 — Node Not Found</p>
        <h1 className="text-4xl font-headline font-bold tracking-tight">This page doesn't exist</h1>
        <p className="text-muted-foreground text-sm max-w-sm mx-auto">
          The environmental node you're looking for has been decommissioned or never existed.
        </p>
      </div>
      <Link href="/dashboard">
        <Button className="rounded-xl px-8 h-12 bg-primary text-white font-bold shadow-lg shadow-primary/20">
          <ArrowLeft className="h-4 w-4 mr-2" /> Return to Dashboard
        </Button>
      </Link>
    </div>
  );
}
