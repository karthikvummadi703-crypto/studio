
import type { Metadata } from 'next';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase';
import { Toaster } from '@/components/ui/toaster';
import { GlobalNavigation } from '@/components/layout/global-navigation';

export const metadata: Metadata = {
  title: 'EcoPulse AI - Carbon Footprint Awareness',
  description: 'Track and reduce your carbon footprint with AI-powered insights.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background text-foreground min-h-screen relative overflow-x-hidden">
        {/* Global Brighter Background Image */}
        <div 
          className="fixed inset-0 z-0 pointer-events-none bg-cover bg-center brightness-150 saturate-[1.2]" 
          style={{ backgroundImage: "url('https://picsum.photos/seed/ecopulse-vibrant-bloom/1920/1080')" }}
          data-ai-hint="vibrant lush valley flowers"
        />
        {/* Minimal Overlay for readability */}
        <div className="fixed inset-0 z-0 bg-white/10 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col min-h-screen">
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
