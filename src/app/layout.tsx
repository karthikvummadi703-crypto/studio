import type { Metadata, Viewport } from 'next';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase';
import { Toaster } from '@/components/ui/toaster';
import { GlobalNavigation } from '@/components/layout/global-navigation';

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
        {/* Fixed High-Fidelity Background Layer */}
        <div 
          className="fixed inset-0 z-0 pointer-events-none bg-cover bg-center brightness-110 saturate-[1.1] opacity-60" 
          style={{ backgroundImage: "url('https://picsum.photos/seed/ecopulse-vibrant-bloom/1920/1080')" }}
          data-ai-hint="vibrant lush valley flowers"
          aria-hidden="true"
        />
        <div className="fixed inset-0 z-0 bg-white/30 backdrop-blur-[1px] pointer-events-none" aria-hidden="true" />
        
        <div className="relative z-10">
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
