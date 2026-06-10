import type { Metadata, Viewport } from 'next';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase';
import { Toaster } from '@/components/ui/toaster';
import { GlobalNavigation } from '@/components/layout/global-navigation';
import Image from 'next/image';

export const viewport: Viewport = {
  themeColor: '#10b981',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'EcoPulse AI | Premium Carbon Analytics',
  description: 'High-performance carbon footprint tracking and AI-driven sustainability strategies.',
  keywords: ['sustainability', 'carbon footprint', 'AI advisor', 'green points', 'eco-friendly'],
  authors: [{ name: 'EcoPulse AI Team' }],
  openGraph: {
    title: 'EcoPulse AI - Environmental Strategy',
    description: 'Track and reduce your carbon footprint with AI.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body text-foreground min-h-screen relative overflow-x-hidden selection:bg-primary/30 bg-background">
        {/* High-Fidelity Fixed Background Image Layer - Optimized with Next/Image */}
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <Image
            src="https://picsum.photos/seed/ecopulse-vibrant-bloom/1920/1080"
            alt="Vibrant environmental background"
            fill
            priority
            className="object-cover brightness-110 saturate-[1.1] opacity-40 transition-opacity duration-1000"
            data-ai-hint="vibrant lush valley flowers"
          />
        </div>
        
        <div className="relative z-10 min-h-screen">
          <FirebaseClientProvider>
            <GlobalNavigation>
              {children}
            </GlobalNavigation>
            <Toaster />
          </FirebaseClientProvider>
        </div>
      </body>
    </html>
  );
}
