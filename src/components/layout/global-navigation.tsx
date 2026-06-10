
'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { DashboardSidebar } from './dashboard-sidebar';
import { MoreHorizontal, Bell, Search, X } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { useUser } from '@/firebase';
import { cn } from '@/lib/utils';
import { FloatingAIAdvisor } from '@/components/ai/floating-advisor';
import { usePathname, useRouter } from 'next/navigation';

export function GlobalNavigation({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { user, isLoading } = useUser();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAuthPage = useMemo(() => {
    return pathname === '/login' || pathname === '/register' || pathname === '/';
  }, [pathname]);

  useEffect(() => {
    if (mounted && !isLoading && !user && !isAuthPage) {
      router.push('/login');
    }
  }, [mounted, isLoading, user, isAuthPage, router]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  const userInitial = useMemo(() => {
    return user?.displayName?.[0] || user?.email?.[0] || 'E';
  }, [user]);

  // STABLE SHELL: We keep the root structure identical on server and client.
  // We only conditionally render the inner parts (sidebar, header) after mounting.
  const showNav = mounted && !isAuthPage && user;

  return (
    <div className="flex h-screen overflow-hidden w-full bg-background">
      {/* Sidebar - Rendered inside a stable shell */}
      {showNav && (
        <nav 
          className={cn(
            "fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
            isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          )}
        >
          <DashboardSidebar onClose={closeSidebar} />
        </nav>
      )}

      {/* Main Content Area - Stable container to prevent hydration mismatch */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {showNav && (
          <header className="h-16 border-b border-black/5 bg-white/40 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-30 transition-all">
            <div className="flex items-center gap-6">
              <button 
                onClick={toggleSidebar}
                className="p-2 hover:bg-primary/10 rounded-full text-primary transition-all flex items-center justify-center"
              >
                {isSidebarOpen ? <X className="h-6 w-6" /> : <MoreHorizontal className="h-8 w-8" />}
              </button>

              <div className="flex flex-col select-none">
                <p className="text-[9px] font-black text-primary tracking-[0.2em] uppercase">EcoPulse AI</p>
                <h2 className="text-[11px] font-headline font-bold text-foreground uppercase tracking-widest hidden sm:block">Node Active</h2>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden md:flex relative w-48 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="Search..." 
                  className="pl-9 h-8 bg-white/40 border-primary/10 rounded-full text-[10px]"
                />
              </div>
              <button className="p-2 text-muted-foreground hover:text-primary transition-colors">
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
        
        {/* Main content scroll area */}
        <main className="flex-1 overflow-y-auto custom-scrollbar relative">
          <div className={cn(
            "max-w-7xl mx-auto p-4 sm:p-8 pb-24",
            !isAuthPage && mounted && "bg-white/10 backdrop-blur-[2px] min-h-full"
          )}>
            {children}
          </div>
          {showNav && <FloatingAIAdvisor />}
        </main>
      </div>

      {/* Overlay */}
      {showNav && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/10 backdrop-blur-[2px] z-40 md:hidden" 
          onClick={closeSidebar}
        />
      )}
    </div>
  );
}
