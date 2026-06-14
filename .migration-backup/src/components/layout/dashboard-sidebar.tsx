"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Calculator, 
  BookOpen, 
  User, 
  Leaf,
  X,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
  { name: 'DASHBOARD', href: '/dashboard', icon: LayoutDashboard },
  { name: 'CALCULATOR', href: '/calculator', icon: Calculator },
  { name: 'KNOWLEDGE HUB', href: '/knowledge-hub', icon: BookOpen },
  { name: 'AI ADVISOR', href: '/ai-advisor', icon: Sparkles },
  { name: 'PROFILE', href: '/profile', icon: User },
];

/**
 * Solid Dashboard Sidebar for maximum GPU efficiency.
 */
export function DashboardSidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-black/5 flex flex-col h-screen bg-white">
      <div className="p-8 flex items-center justify-between">
        <Link 
          href="/dashboard" 
          className="flex items-center gap-3 group focus-visible:ring-2 focus-visible:ring-primary rounded-xl outline-none" 
          onClick={onClose}
          aria-label="EcoPulse Home"
        >
          <div className="p-2 bg-primary rounded-lg shadow-lg shadow-primary/20 transition-transform group-hover:scale-110">
            <Leaf className="h-5 w-5 text-white fill-current" />
          </div>
          <span className="font-headline font-bold text-lg tracking-[0.1em] text-foreground uppercase">ECOPULSE AI</span>
        </Link>
        <button 
          onClick={onClose} 
          className="md:hidden p-2 text-zinc-500 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary rounded-full outline-none"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-8" aria-label="Main Navigation">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.href} 
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all text-[11px] font-bold tracking-[0.1em] outline-none focus-visible:ring-2 focus-visible:ring-primary",
                isActive 
                  ? "bg-primary text-white shadow-xl shadow-primary/25 scale-[1.02]" 
                  : "text-zinc-500 hover:text-primary hover:bg-primary/5"
              )}
            >
              <item.icon className={cn("h-5 w-5 transition-colors", isActive ? "text-white" : "text-zinc-500/40")} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-8 mt-auto">
        <div className="p-5 rounded-2xl bg-primary/5 border border-primary/10 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-black text-zinc-600 tracking-widest uppercase">Impact Level</span>
            <span className="text-[9px] font-black text-primary tracking-widest uppercase">Growing</span>
          </div>
          <div className="h-1.5 w-full bg-black/5 rounded-full overflow-hidden" role="progressbar" aria-valuenow={66} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full w-2/3 bg-primary" />
          </div>
        </div>
      </div>
    </aside>
  );
}
