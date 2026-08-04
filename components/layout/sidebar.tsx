"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Brain,
  MessageSquare,
  Wrench,
  Upload,
  Users,
  LayoutDashboard,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  BarChart3,
  Bell,
  Moon,
  Sun,
  Monitor,
  ToggleLeft,
  ToggleRight,
  Menu,
} from "lucide-react";
import { KNLogo } from "@/components/ui/kn-logo";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useApp } from "@/contexts/app-context";
import { ProfileCard } from "@/components/ui/profile-card";

const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    name: "AI Engine",
    href: "/ai-engine",
    icon: Brain,
    description: "AI-powered analysis & insights",
  },
  {
    name: "Chat Assistant",
    href: "/chat",
    icon: MessageSquare,
    description: "Real-time AI assistant",
  },
  {
    name: "Data Tools",
    href: "/tools",
    icon: Wrench,
    description: "Processing & conversion",
  },
  {
    name: "File Manager",
    href: "/uploads",
    icon: Upload,
    description: "Upload & manage files",
  },
  {
    name: "Reports",
    href: "/reports",
    icon: FileSpreadsheet,
    description: "Generated reports",
  },
  {
    name: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    description: "Performance metrics",
  },
];

const bottomNavigation = [
  {
    name: "User Management",
    href: "/users",
    icon: Users,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

interface SidebarProps {
  collapsed: boolean;
  onCollapsedChange: (v: boolean) => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({
  collapsed,
  onCollapsedChange,
  mobileOpen,
  onMobileClose,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-[100dvh] bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-transform duration-300 flex flex-col",
          collapsed ? "w-16" : "w-64",
          !mobileOpen && "sidebar-hidden-mobile",
        )}
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-sidebar-border">
          <Link href="/" className="flex items-center" onClick={onMobileClose}>
            <KNLogo showText={!collapsed} />
          </Link>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto sidebar-scroll">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const NavLink = (
              <Link
                key={item.name}
                href={item.href}
                onClick={onMobileClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                )}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 flex-shrink-0",
                    isActive
                      ? "text-sidebar-primary"
                      : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground",
                  )}
                />
                {!collapsed && (
                  <span className="text-sm font-medium">{item.name}</span>
                )}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.name}>
                  <TooltipTrigger asChild>{NavLink}</TooltipTrigger>
                  <TooltipContent side="right" className="flex flex-col">
                    <span className="font-medium">{item.name}</span>
                    {item.description && (
                      <span className="text-xs text-muted-foreground">
                        {item.description}
                      </span>
                    )}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return NavLink;
          })}
        </nav>

        {/* Bottom Navigation */}
        <div className="px-2 py-4 border-t border-sidebar-border space-y-1">
          {bottomNavigation.map((item) => {
            const isActive = pathname === item.href;
            const NavLink = (
              <Link
                key={item.name}
                href={item.href}
                onClick={onMobileClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                )}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 flex-shrink-0",
                    isActive
                      ? "text-sidebar-primary"
                      : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground",
                  )}
                />
                {!collapsed && (
                  <span className="text-sm font-medium">{item.name}</span>
                )}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.name}>
                  <TooltipTrigger asChild>{NavLink}</TooltipTrigger>
                  <TooltipContent side="right">
                    <span className="font-medium">{item.name}</span>
                  </TooltipContent>
                </Tooltip>
              );
            }

            return NavLink;
          })}

          {/* Logout */}
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sidebar-foreground/70 hover:bg-destructive/10 hover:text-destructive w-full"
                  disabled
                >
                  <LogOut className="h-5 w-5 flex-shrink-0" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <span className="font-medium">Use profile menu to logout</span>
              </TooltipContent>
            </Tooltip>
          ) : (
            <button
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sidebar-foreground/70 cursor-not-allowed opacity-50 w-full"
              disabled
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm font-medium">Log Out</span>
            </button>
          )}
        </div>

        {/* Collapse Toggle — desktop only */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-3 top-20 h-6 w-6 rounded-full border border-sidebar-border bg-sidebar shadow-sm hover:bg-sidebar-accent hidden md:flex"
          onClick={() => onCollapsedChange(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </Button>
      </aside>
    </TooltipProvider>
  );
}

interface HeaderProps {
  onMobileMenuToggle: () => void;
}

export function Header({ onMobileMenuToggle }: HeaderProps) {
  const { setTheme } = useTheme();
  const { demoMode, setDemoMode, backendConnected } = useApp();

  return (
    <header className="flex-shrink-0 z-30 h-16 bg-card border-b border-border flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-2 md:gap-4">
        {/* Mobile hamburger */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-11 w-11"
          onClick={onMobileMenuToggle}
        >
          <Menu className="h-5 w-5" />
        </Button>
        {/* Logo icon on mobile — full title too wide for phone header */}
        <KNLogo showText={false} size="sm" className="md:hidden" />
        <h1 className="hidden md:block text-lg font-semibold text-foreground">
          Guardian Bank Portal
        </h1>
      </div>
      <div className="flex items-center gap-2 md:gap-3">
        {/* Demo Mode Toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDemoMode(!demoMode)}
              className={cn(
                "gap-1.5 text-xs touch-expand",
                demoMode
                  ? "text-amber-600 dark:text-amber-400"
                  : backendConnected
                    ? "text-green-600 dark:text-green-400"
                    : "text-muted-foreground",
              )}
            >
              {demoMode ? (
                <ToggleRight className="h-4 w-4" />
              ) : (
                <ToggleLeft className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">
                {demoMode ? "Demo" : backendConnected ? "Live" : "Offline"}
              </span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {demoMode
                ? "Demo Mode: Using fake data"
                : backendConnected
                  ? "Live: Connected to backend"
                  : "Offline: Backend disconnected"}
            </p>
            <p className="text-xs text-muted-foreground">Click to toggle</p>
          </TooltipContent>
        </Tooltip>

        {/* Theme Toggle */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme("light")}>
              <Sun className="h-4 w-4 mr-2" />
              Light
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              <Moon className="h-4 w-4 mr-2" />
              Dark
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>
              <Monitor className="h-4 w-4 mr-2" />
              System
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative hidden sm:flex">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-accent text-accent-foreground text-[10px] rounded-full flex items-center justify-center font-medium">
            3
          </span>
        </Button>

        <div className="h-8 w-px bg-border hidden sm:block" />

        {/* Profile Card */}
        <ProfileCard />
      </div>
    </header>
  );
}
