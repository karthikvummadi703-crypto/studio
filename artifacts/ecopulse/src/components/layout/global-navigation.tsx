import React, { useCallback, useMemo, useState, useEffect, useRef, Suspense } from "react";
import { lazy } from "react";
import { DashboardSidebar } from "./dashboard-sidebar";
import { DemoBanner } from "./demo-banner";
import { MoreHorizontal, Bell, Search, X } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui";
import { useUser } from "@/firebase";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

const FloatingAIAdvisor = lazy(() =>
  import("@/components/ai/floating-advisor").then((m) => ({ default: m.FloatingAIAdvisor }))
);

/**
 * Shell layout component that wraps every authenticated page with the
 * top navigation bar, collapsible sidebar, demo banner, and floating AI advisor.
 */
export function GlobalNavigation({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, isLoading, isDemo } = useUser();
  const [pathname] = useLocation();
  const sidebarRef = useRef<HTMLElement>(null);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);

  const isAuthPage = useMemo(() => {
    return (
      pathname === "/login" ||
      pathname === "/register" ||
      pathname === "/forgot-password" ||
      pathname === "/"
    );
  }, [pathname]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false);
    toggleButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!isSidebarOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeSidebar();
        return;
      }

      if (e.key === "Tab" && sidebarRef.current) {
        const focusable = sidebarRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (!focusable.length) return;

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isSidebarOpen, closeSidebar]);

  // Move focus into sidebar when it opens on mobile
  useEffect(() => {
    if (isSidebarOpen && sidebarRef.current) {
      const first = sidebarRef.current.querySelector<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      first?.focus();
    }
  }, [isSidebarOpen]);

  const userInitial = useMemo(() => {
    return user?.displayName?.[0] || user?.email?.[0] || "E";
  }, [user]);

  const showNav = !isAuthPage && !!user && !isLoading;

  return (
    <div className="flex flex-col h-screen overflow-hidden w-full bg-transparent">
      {showNav && isDemo && <DemoBanner />}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {isLoading && !isAuthPage && (
          <div role="status" aria-label="Loading authentication state" className="sr-only">
            Loading...
          </div>
        )}
        {showNav && (
          <nav
            ref={sidebarRef}
            aria-label="Sidebar Navigation"
            aria-modal={isSidebarOpen ? "true" : undefined}
            className={cn(
              "fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
              isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            )}
          >
            <DashboardSidebar onClose={closeSidebar} />
          </nav>
        )}

        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          {showNav && (
            <header className="h-16 border-b border-zinc-100 bg-white flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm">
              <div className="flex items-center gap-6">
                <button
                  ref={toggleButtonRef}
                  onClick={toggleSidebar}
                  aria-expanded={isSidebarOpen}
                  aria-controls="sidebar-nav"
                  aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
                  className="p-2 hover:bg-primary/10 rounded-full text-primary transition-all flex items-center justify-center focus-visible:ring-2 focus-visible:ring-primary outline-none"
                >
                  {isSidebarOpen ? (
                    <X className="h-6 w-6" aria-hidden="true" />
                  ) : (
                    <MoreHorizontal className="h-8 w-8" aria-hidden="true" />
                  )}
                </button>

                <div className="flex flex-col select-none">
                  <p className="text-xs font-black text-primary tracking-widest uppercase">
                    EcoPulse AI
                  </p>
                  <h2 className="text-xs font-headline font-bold text-foreground uppercase tracking-widest hidden sm:block">
                    {isDemo ? "Demo Session" : "Node Active"}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="hidden md:flex relative w-48 group" role="search">
                  <label htmlFor="global-search" className="sr-only">
                    Search EcoPulse
                  </label>
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-primary transition-colors"
                    aria-hidden="true"
                  />
                  <Input
                    id="global-search"
                    placeholder="Search..."
                    aria-label="Search EcoPulse"
                    className="pl-9 h-8 bg-zinc-50 border-primary/10 rounded-full text-xs focus-visible:ring-primary"
                  />
                </div>
                <button
                  className="p-2 text-zinc-500 hover:text-primary transition-colors focus-visible:ring-2 focus-visible:ring-primary rounded-full outline-none"
                  aria-label="View notifications"
                >
                  <Bell className="h-4 w-4" aria-hidden="true" />
                </button>
                <div className="flex items-center gap-3 pl-4 border-l border-primary/10">
                  <Avatar className="h-8 w-8 border border-primary/30 rounded-lg bg-primary/10 shadow-sm">
                    <AvatarFallback className="text-primary text-xs font-bold">
                      {userInitial}
                    </AvatarFallback>
                  </Avatar>
                  {isDemo && (
                    <span className="hidden sm:inline text-xs font-black text-primary uppercase tracking-widest bg-primary/10 px-2 py-1 rounded-lg">
                      Demo
                    </span>
                  )}
                </div>
              </div>
            </header>
          )}

          <main
            id="main-content"
            className="flex-1 overflow-y-auto custom-scrollbar relative bg-transparent outline-none"
            tabIndex={-1}
          >
            <div
              className={cn(
                "max-w-7xl mx-auto p-4 sm:p-8 pb-24 relative z-10",
                showNav && "min-h-full"
              )}
            >
              <Suspense
                fallback={
                  <div className="h-full flex items-center justify-center py-20">
                    <Spinner className="h-10 w-10 text-primary" label="Loading content..." />
                  </div>
                }
              >
                {children}
              </Suspense>
            </div>
            {showNav && <FloatingAIAdvisor />}
          </main>
        </div>

        {showNav && isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/10 z-40 md:hidden"
            onClick={closeSidebar}
            aria-hidden="true"
          />
        )}
      </div>
    </div>
  );
}
