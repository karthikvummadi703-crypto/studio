
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

  // During the design phase, we skip the loading state if it hangs 
  // and prioritize showing the UI structure.
  
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
