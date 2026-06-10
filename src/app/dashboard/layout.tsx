"use client";

import { DashboardSidebar } from '@/components/layout/dashboard-sidebar';
import { FloatingAIAdvisor } from '@/components/ai/floating-advisor';
import { Bell, Globe, Search } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useUser } from '@/firebase';
import { Input } from '@/components/ui/input';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useUser();

  return (
    <div className="relative min-h-screen bg-background text-foreground font-body overflow-hidden">
      {/* Brighter Global Background Image */}
      <div 
        className="fixed inset-0 z-0 opacity-40 pointer-events-none bg-cover bg-center transition-opacity duration-1000" 
        style={{ backgroundImage: "url('https://picsum.photos/seed/ecopulse-bg/1920/1080')" }}
        data-ai-hint="lush green valley landscape"
      />
      
      {/* Light Overlay to pop the content */}
      <div className="fixed inset-0 z-0 bg-white/20 pointer-events-none" />

      <div className="relative z-10 flex h-full">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col min-w-0 h-screen">
          <header className="h-16 border-b border-black/5 bg-white/60 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-30">
            <div className="flex items-center gap-8">
              <div className="flex flex-col">
                <p className="text-[10px] font-bold text-primary tracking-[0.2em] uppercase">Status: Online</p>
                <h2 className="text-xs font-headline font-bold text-foreground uppercase tracking-widest">Sustainability Hub</h2>
              </div>
              
              <div className="hidden md:flex relative w-64 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="Search telemetry..." 
                  className="pl-10 h-9 bg-black/5 border-transparent focus-visible:ring-primary/20 rounded-full text-xs"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-3 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/10">
                <Globe className="h-4 w-4 text-primary animate-pulse" />
                <span className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">Syncing Data</span>
              </div>
              
              <button className="relative p-2 text-muted-foreground hover:text-primary transition-colors">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-primary rounded-full border-2 border-white"></span>
              </button>
              
              <div className="flex items-center gap-3 pl-4 border-l border-black/5">
                <div className="text-right hidden sm:block">
                  <p className="text-[11px] font-bold text-foreground tracking-tight">{user?.displayName || 'User'}</p>
                  <p className="text-[9px] font-bold text-primary tracking-widest uppercase">Member</p>
                </div>
                <Avatar className="h-10 w-10 border border-primary/20 rounded-xl bg-primary/10">
                  <AvatarFallback className="text-primary font-bold">
                    {user?.displayName?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </header>
          
          <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <div className="max-w-7xl mx-auto space-y-10 pb-24">
              {children}
            </div>
          </main>

          <FloatingAIAdvisor />
        </div>
      </div>
    </div>
  );
}