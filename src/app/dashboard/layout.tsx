
"use client";

import { DashboardSidebar } from '@/components/layout/dashboard-sidebar';
import { FloatingAIAdvisor } from '@/components/ai/floating-advisor';
import { useUser } from '@/firebase';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading } = useUser();

  // Authentication gate is temporarily removed for design purposes.
  // We'll restore redirection to /login in the final phase.

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
        <FloatingAIAdvisor />
      </main>
    </div>
  );
}
