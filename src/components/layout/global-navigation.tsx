'use client';

import React, { useCallback, useMemo, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { DashboardSidebar } from './dashboard-sidebar';
import { MoreHorizontal, Bell, Search, X } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { useUser } from '@/firebase';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

const FloatingAIAdvisor = dynamic(
  () => import('@/components/ai/floating-advisor').then(m => ({ default: m.FloatingAIAdvisor })),
  { ssr: false, loading: () => null }
);

export function GlobalNavigation({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, isLoading } = useUser();
  const pathname = usePathname();

  const isAuthPage = useMemo(() => {
    return pathname === '/login' || pathname === '/register' || pathname === '/';
  }, [pathname]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  useEffect(() => {
    if (!isSidebarOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeSidebar();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSidebarOpen, closeSidebar]);

  const userInitial = useMemo(() => {
    return user?.displayName?.[0] || user?.email?.[0] || 'E';
  }, [user]);

  // Authentication Guard for Shell Rendering
  const showNav = !isAuthPage && !!user && !isLoading;

  return (
    <div className="flex h-screen overflow-hidden w-full bg-transparent" suppressHydrationWarning>
      {isLoading && !isAuthPage && (
        <div
          role="status"
          aria-label="Loading authentication state"
          className="sr-only"
        >
          Loading...
        </div>
      )}
      {showNav && (
        <nav 
          aria-label="Sidebar Navigation"
          className={cn(
            "fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
            isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          )}
        >
          <DashboardSidebar onClose={closeSidebar} />
        </nav>
      )}

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {showNav && (
          <header className="h-16 border-b border-zinc-100 bg-white flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm">
            <div className="flex items-center gap-6">
              <button 
                onClick={toggleSidebar}
                aria-expanded={isSidebarOpen}
                aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
                className="p-2 hover:bg-primary/10 rounded-full text-primary transition-all flex items-center justify-center focus-visible:ring-2 focus-visible:ring-primary outline-none"
              >
                {isSidebarOpen ? <X className="h-6 w-6" /> : <MoreHorizontal className="h-8 w-8" />}
              </button>

              <div className="flex flex-col select-none">
                <p className="text-[9px] font-black text-primary tracking-[0.2em] uppercase">EcoPulse AI</p>
                <h2 className="text-[11px] font-headline font-bold text-foreground uppercase tracking-widest hidden sm:block">Node Active</h2>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden md:flex relative w-48 group" role="search">
                <label htmlFor="global-search" className="sr-only">Search EcoPulse</label>
                <Search 
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-primary transition-colors" 
                  aria-hidden="true" 
                />
                <Input 
                  id="global-search"
                  placeholder="Search..." 
                  aria-label="Search EcoPulse"
                  className="pl-9 h-8 bg-zinc-50 border-primary/10 rounded-full text-[10px] focus-visible:ring-primary"
                />
              </div>
              <button 
                className="p-2 text-zinc-500 hover:text-primary transition-colors focus-visible:ring-2 focus-visible:ring-primary rounded-full outline-none"
                aria-label="View notifications"
              >
                <Bell className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-3 pl-4 border-l border-primary/10">
                <Avatar className="h-8 w-8 border border-primary/30 rounded-lg bg-primary/10 shadow-sm">
                  <AvatarFallback className="text-primary text-[10px] font-bold">
                    {userInitial}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </header>
        )}
        
        <main 
          id="main-content"
          className="flex-1 overflow-y-auto custom-scrollbar relative bg-transparent outline-none"
          tabIndex={-1}
        >
          <div className={cn(
            "max-w-7xl mx-auto p-4 sm:p-8 pb-24 relative z-10",
            showNav && "min-h-full"
          )}>
            {children}
          </div>
          {showNav && <FloatingAIAdvisor />}
        </main>
      </div>

      {showNav && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/10 z-40 md:hidden" 
          onClick={closeSidebar}
          aria-hidden="true"
          role="presentation"
        />
      )}
    </div>
  );
}