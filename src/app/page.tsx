
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Leaf, Zap, Globe, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-16 flex items-center border-b border-white/5 backdrop-blur-md sticky top-0 z-50">
        <Link className="flex items-center justify-center gap-2" href="/">
          <Leaf className="h-6 w-6 text-primary" />
          <span className="font-headline font-bold text-xl tracking-tighter">EcoPulse AI</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
          <Button asChild variant="ghost" className="text-sm font-medium hover:text-primary transition-colors">
             <Link href="/dashboard">View Demo</Link>
          </Button>
          <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Link href="/dashboard">Get Started</Link>
          </Button>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 px-4">
          <div className="container mx-auto">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-4xl font-headline font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none">
                  Pulse Check Your <span className="text-primary emerald-glow">Carbon Impact</span>
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl font-body">
                  EcoPulse AI uses advanced intelligence to track, analyze, and help you reduce your environmental footprint. Premium insights for a sustainable future.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="h-12 px-8 bg-primary text-primary-foreground">
                  <Link href="/dashboard">Start Your Journey <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-12 px-8 border-primary/20 hover:bg-primary/5">
                  <Link href="/dashboard">Explore Dashboard</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-secondary/50">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid gap-12 lg:grid-cols-3">
              <div className="flex flex-col items-center space-y-4 text-center p-6 glass-card rounded-2xl">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Zap className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-headline font-bold">AI Insights</h3>
                <p className="text-muted-foreground">
                  Personalized carbon reduction strategies powered by Gemini AI.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center p-6 glass-card rounded-2xl">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Globe className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-headline font-bold">Real-time Analytics</h3>
                <p className="text-muted-foreground">
                  Visual emission trends and weekly progress reports at your fingertips.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center p-6 glass-card rounded-2xl">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Leaf className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-headline font-bold">Smart Tracking</h3>
                <p className="text-muted-foreground">
                  Effortless calculation of transportation, energy, and lifestyle impact.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="w-full py-6 border-t border-white/5 px-4 md:px-6">
        <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">© 2024 EcoPulse AI. All rights reserved.</p>
          <nav className="flex gap-4 sm:gap-6">
            <Link className="text-xs hover:underline underline-offset-4 text-muted-foreground" href="#">Terms</Link>
            <Link className="text-xs hover:underline underline-offset-4 text-muted-foreground" href="#">Privacy</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
