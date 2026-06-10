
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Calculator, 
  BookOpen, 
  User, 
  Settings, 
  Home,
  Leaf,
  Trophy
} from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Impact Audit', href: '/calculator', icon: Calculator },
  { name: 'Knowledge Hub', href: '/knowledge-hub', icon: BookOpen },
  { name: 'My Progress', href: '/progress', icon: Trophy },
  { name: 'Profile', href: '/profile', icon: User },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-white/5 flex flex-col h-screen sticky top-0 bg-card/30 backdrop-blur-xl z-40">
      <div className="p-6">
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <div className="p-2 bg-primary/20 rounded-lg group-hover:scale-110 transition-transform">
            <Leaf className="h-6 w-6 text-primary" />
          </div>
          <span className="font-headline font-bold text-xl tracking-tight">EcoPulse</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1.5 mt-4">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all group relative overflow-hidden",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                  : "hover:bg-white/5 text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5 z-10", isActive ? "" : "group-hover:text-primary")} />
              <span className="font-medium z-10">{item.name}</span>
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-primary pointer-events-none" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-6 border-t border-white/5 mt-auto">
        <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20">
           <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Preview Mode</p>
           <p className="text-xs text-muted-foreground leading-relaxed">Design phase active. Authentication disabled.</p>
        </div>
      </div>
    </aside>
  );
}
