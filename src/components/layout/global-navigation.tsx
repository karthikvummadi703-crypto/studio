
"use client";

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { DashboardSidebar } from './dashboard-sidebar';
import { MoreHorizontal, Bell, Search, X } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { useUser } from '@/firebase';
import { cn } from '@/lib/utils';
import { FloatingAIAdvisor } from '@/components/ai/floating-advisor';
import { usePathname } from 'next/navigation';

export function GlobalNavigation({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { user } = useUser();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  const userInitial = useMemo(() => {
    return user?.displayName?.[0] || user?.email?.[0] || 'E';
  }, [user]);

  // Determine if we are on a landing or auth page
  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/';

  // Prevent hydration mismatch by rendering a stable structure initially
  if (!mounted) {
    return (
      <div className="flex flex-col min-h-screen w-full bg-background">
        <main className="flex-1">{children}</main>
      </div>
    );
  }

  // Auth pages use a simple centered layout without sidebar
  if (isAuthPage) {
    return (
      <div className="flex flex-col min-h-screen w-full bg-background">
        <main className="flex-1">{children}</main>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden w-full bg-background">
      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden transition-opacity" 
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Navigation Sidebar */}
      <nav 
        className={cn(
          "fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
          isSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        )}
        aria-label="Main Navigation"
      >
        <DashboardSidebar onClose={closeSidebar} />
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="h-16 border-b border-black/5 bg-white/60 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm transition-all">
          <div className="flex items-center gap-6">
            <button 
              onClick={toggleSidebar}
              className="p-2 hover:bg-primary/10 rounded-full text-primary transition-all flex items-center justify-center focus:ring-2 focus:ring-primary/20 outline-none"
              aria-expanded={isSidebarOpen}
              aria-label="Toggle navigation menu"
            >
              {isSidebarOpen ? <X className="h-6 w-6" /> : <MoreHorizontal className="h-8 w-8" />}
            </button>

            <div className="flex flex-col select-none">
              <p className="text-[9px] font-black text-primary tracking-[0.2em] uppercase">EcoPulse AI</p>
              <h2 className="text-[11px] font-headline font-bold text-foreground uppercase tracking-widest hidden sm:block">Telemetry Node Active</h2>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex relative w-48 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" aria-hidden="true" />
              <Input 
                placeholder="Search metrics..." 
                className="pl-9 h-8 bg-white/40 border-primary/10 focus-visible:ring-primary/20 rounded-full text-[10px] shadow-none"
              />
            </div>
            
            <button 
              className="relative p-2 text-muted-foreground hover:text-primary transition-colors focus:ring-2 focus:ring-primary/20 rounded-full"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full border-2 border-white shadow-sm"></span>
            </button>
            
            <div className="flex items-center gap-3 pl-4 border-l border-primary/10">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-bold text-foreground leading-tight">{user?.displayName || 'Eco Warrior'}</p>
                <p className="text-[8px] font-bold text-primary tracking-widest uppercase">Verified Account</p>
              </div>
              <Avatar className="h-8 w-8 border border-primary/30 rounded-lg bg-primary/10 shadow-sm ring-offset-2 ring-primary/5">
                <AvatarFallback className="text-primary text-[10px] font-bold">
                  {userInitial}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar relative focus:outline-none" tabIndex={-1}>
          <div className="max-w-7xl mx-auto pb-24">
            {children}
          </div>
          <FloatingAIAdvisor />
        </main>
      </div>
    </div>
  );
}
