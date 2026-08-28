"use client";

import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar, Header } from "./sidebar";
import { useApp } from "@/contexts/app-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const INACTIVITY_LIMIT_MS = 5 * 60 * 1000;
const COUNTDOWN_WARNING_MS = 60 * 1000;
// Activity events (pointermove, scroll, wheel...) can fire dozens of times a
// second — resetting on every single one would re-render this whole layout
// (and everything inside it) that often. A 5-minute timeout doesn't need
// millisecond precision, so only actually reset at most this often.
const ACTIVITY_RESET_THROTTLE_MS = 5_000;

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const { isAuthenticated, logout } = useApp();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sessionDeadline, setSessionDeadline] = useState<number>(() => Date.now() + INACTIVITY_LIMIT_MS);
  const [remainingMs, setRemainingMs] = useState(INACTIVITY_LIMIT_MS);
  const isLoggingOutRef = useRef(false);
  const lastResetAtRef = useRef(0);

  const resetInactivityTimer = useCallback(() => {
    setSessionDeadline(Date.now() + INACTIVITY_LIMIT_MS);
    setRemainingMs(INACTIVITY_LIMIT_MS);
  }, []);

  // Throttled entry point for high-frequency DOM events — only calls the
  // actual state-updating reset (and thus re-renders) at most once per
  // ACTIVITY_RESET_THROTTLE_MS, regardless of how often the event fires.
  const handleActivityEvent = useCallback(() => {
    const now = Date.now();
    if (now - lastResetAtRef.current < ACTIVITY_RESET_THROTTLE_MS) return;
    lastResetAtRef.current = now;
    resetInactivityTimer();
  }, [resetInactivityTimer]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const activityEvents = [
      "pointerdown",
      "pointermove",
      "keydown",
      "scroll",
      "touchstart",
      "wheel",
    ] as const;

    lastResetAtRef.current = Date.now();
    resetInactivityTimer();
    activityEvents.forEach((event) => {
      window.addEventListener(event, handleActivityEvent, { passive: true });
    });

    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleActivityEvent);
      });
    };
  }, [isAuthenticated, resetInactivityTimer, handleActivityEvent]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(async () => {
      const nextRemaining = Math.max(sessionDeadline - Date.now(), 0);
      setRemainingMs(nextRemaining);

      if (nextRemaining <= 0 && !isLoggingOutRef.current) {
        isLoggingOutRef.current = true;
        await logout();
        router.push("/auth/login?reason=inactive");
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, logout, router, sessionDeadline]);

  if (!isAuthenticated) {
    return null;
  }

  const showCountdown = remainingMs <= COUNTDOWN_WARNING_MS;
  const remainingSeconds = Math.max(Math.ceil(remainingMs / 1000), 0);

  return (
    <div className="fixed inset-0 overflow-hidden bg-background">
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}
      <Sidebar
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />
      <div
        className={cn(
          "flex flex-col h-full transition-[padding-left] duration-300",
          sidebarCollapsed ? "content-offset-collapsed" : "content-offset",
        )}
      >
        <Header onMobileMenuToggle={() => setMobileSidebarOpen((v) => !v)} />
        <main className="main-scroll flex-1 min-h-0 overflow-y-auto overflow-x-hidden bg-[linear-gradient(180deg,rgba(255,255,255,0.34),transparent_34%)] p-4 md:p-6">
          {children}
        </main>
      </div>
      {showCountdown && (
        <div className="fixed bottom-4 right-4 z-50 w-[min(calc(100vw-2rem),360px)] rounded-lg border border-warning/30 bg-card p-4 shadow-lg">
          <p className="text-sm font-semibold text-foreground">Session expiring soon</p>
          <p className="mt-1 text-xs text-muted-foreground">
            You will be logged out in {remainingSeconds}s due to inactivity.
          </p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-warning transition-all"
              style={{ width: `${Math.max((remainingMs / COUNTDOWN_WARNING_MS) * 100, 0)}%` }}
            />
          </div>
          <Button size="sm" className="mt-3 h-8 w-full text-xs font-medium" onClick={resetInactivityTimer}>
            Extend session
          </Button>
        </div>
      )}
    </div>
  );
}
