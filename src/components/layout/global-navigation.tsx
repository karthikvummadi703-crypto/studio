
"use client";

import React, { useState } from 'react';
import { DashboardSidebar } from './dashboard-sidebar';
import { MoreHorizontal, Bell, Search, Globe, X } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { useUser } from '@/firebase';
import { cn } from '@/lib/utils';
import { FloatingAIAdvisor } from '@/components/ai/floating-advisor';

export function GlobalNavigation({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useUser();

  return (
    <div className="flex h-screen overflow-hidden w-full">
      {/* Sidebar Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Global Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 transition-transform duration-300 transform md:relative md:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <DashboardSidebar onClose={() => setIsSidebarOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="h-16 border-b border-black/5 bg-white/60 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-6">
            {/* Three Dots Toggle Button */}
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-primary/5 rounded-full text-primary transition-colors flex items-center justify-center"
              aria-label="Toggle Menu"
            >
              {isSidebarOpen ? <X className="h-6 w-6" /> : <MoreHorizontal className="h-8 w-8" />}
            </button>

            <div className="flex flex-col">
              <p className="text-[9px] font-black text-primary tracking-[0.2em] uppercase">EcoPulse AI</p>
              <h2 className="text-[11px] font-headline font-bold text-foreground uppercase tracking-widest hidden sm:block">Telemetry Active</h2>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex relative w-48 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="Search..." 
                className="pl-9 h-8 bg-white/40 border-primary/10 focus-visible:ring-primary/20 rounded-full text-[10px] shadow-none"
              />
            </div>
            
            <button className="relative p-2 text-muted-foreground hover:text-primary transition-colors">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full border-2 border-white"></span>
            </button>
            
            <div className="flex items-center gap-3 pl-4 border-l border-primary/10">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-bold text-foreground">{user?.displayName || 'Eco Warrior'}</p>
                <p className="text-[8px] font-bold text-primary tracking-widest uppercase">Verified</p>
              </div>
              <Avatar className="h-8 w-8 border border-primary/30 rounded-lg bg-primary/10">
                <AvatarFallback className="text-primary text-[10px] font-bold">
                  {user?.displayName?.[0] || 'E'}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar relative">
          <div className="max-w-7xl mx-auto pb-24">
            {children}
          </div>
          <FloatingAIAdvisor />
        </main>
      </div>
    </div>
  );
}
