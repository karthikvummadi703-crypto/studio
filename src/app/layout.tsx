import type { Metadata, Viewport } from 'next';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase';
import { Toaster } from '@/components/ui';
import { GlobalNavigation } from '@/components/layout';
import { Space_Grotesk, Inter } from 'next/font/google';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const spaceGrotesk = Space_Grotesk({ 
  subsets: ['latin'], 
  variable: '--font-headline', 
  display: 'swap' 
});

const inter = Inter({ 
  subsets: ['latin'], 
  variable: '--font-body', 
  display: 'swap' 
});

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

/**
 * Root Layout optimized with self-hosted fonts and stable structural landmarks.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} antialiased`} suppressHydrationWarning>
      <body className="font-body text-foreground min-h-screen relative overflow-x-hidden selection:bg-primary/30">
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-6 focus:py-3 focus:bg-primary focus:text-white focus:rounded-xl focus:font-bold focus:shadow-2xl focus:ring-4 focus:ring-primary/20"
        >
          Skip to main content
        </a>
        <FirebaseClientProvider>
          <ErrorBoundary>
            <GlobalNavigation>
              <div id="main-content">
                {children}
              </div>
            </GlobalNavigation>
          </ErrorBoundary>
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
