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
    <div className="fixed inset-0 overflow-hidden bg-[#F8F9FB]">
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
        <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 md:p-6 main-scroll">
          {children}
        </main>
      </div>
    </div>
  );
}
