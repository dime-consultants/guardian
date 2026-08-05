"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar, Header } from "./sidebar";
import { useApp } from "@/contexts/app-context";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const { isAuthenticated } = useApp();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="fixed inset-0 overflow-hidden bg-[linear-gradient(135deg,#F5FAFE_0%,#F5FAFE_48%,lab(26.1542%_15.7545_-51.5504)_48%,lab(26.1542%_15.7545_-51.5504)_100%)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(52,143,226,0.08),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(245,250,254,0.18),transparent_32%)]" />
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
        <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 md:p-6 main-scroll">{children}</main>
      </div>
    </div>
  );
}
