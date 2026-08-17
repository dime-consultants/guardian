"use client";

import { useState, type CSSProperties } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useApp } from "@/contexts/app-context";
import { ProfileCard } from "@/components/ui/profile-card";

function MaterialIcon({
  name,
  className = "",
  filled = false,
  size = 20,
  style = {},
}: {
  name: string;
  className?: string;
  filled?: boolean;
  size?: number;
  style?: CSSProperties;
}) {
  return (
    <span
      className={`material-symbols-outlined ${filled ? "filled-icon" : ""} ${className}`}
      style={{ fontSize: size, lineHeight: 1, ...style }}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}

const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: "dashboard",
  },
  {
    name: "AI Engine",
    href: "/ai-engine",
    icon: "psychology",
    description: "AI-powered analysis & insights",
  },
  {
    name: "Chat Assistant",
    href: "/chat",
    icon: "chat_bubble",
    description: "Real-time AI assistant",
  },
  {
    name: "Data Tools",
    href: "/tools",
    icon: "build",
    description: "Processing & conversion",
  },
  {
    name: "File Manager",
    href: "/uploads",
    icon: "folder",
    description: "Upload & manage files",
  },
  {
    name: "Reports",
    href: "/reports",
    icon: "summarize",
    description: "Generated reports",
  },
  {
    name: "Analytics",
    href: "/analytics",
    icon: "insights",
    description: "Performance metrics",
  },
];

const bottomNavigation = [
  {
    name: "User Management",
    href: "/users",
    icon: "people",
  },
  {
    name: "Settings",
    href: "/settings",
    icon: "settings",
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
  const [hoveredHref, setHoveredHref] = useState<string | null>(null);

  const getNavStyle = (href: string, isActive: boolean) => {
    if (isActive) {
      return { backgroundColor: "var(--sidebar-primary)", color: "var(--sidebar-primary-foreground)" };
    }
    if (hoveredHref === href) {
      return { backgroundColor: "var(--sidebar-accent)", color: "var(--sidebar-accent-foreground)" };
    }
    return { color: "var(--sidebar-foreground)" };
  };

  const getIconStyle = (href: string, isActive: boolean) => {
    if (isActive) {
      return { color: "var(--sidebar-primary-foreground)" };
    }
    if (hoveredHref === href) {
      return { color: "var(--sidebar-accent-foreground)" };
    }
    return { color: "var(--sidebar-foreground)" };
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-[100dvh] border-r border-sidebar-border transition-transform duration-300 flex flex-col bg-sidebar text-sidebar-foreground",
          collapsed ? "w-16" : "w-64",
          !mobileOpen && "sidebar-hidden-mobile",
        )}
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-border">
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
                onMouseEnter={() => setHoveredHref(item.href)}
                onMouseLeave={() => setHoveredHref(null)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group",
                )}
                style={getNavStyle(item.href, isActive)}
              >
                <MaterialIcon
                  name={item.icon}
                  className="h-5 w-5 flex-shrink-0"
                  style={getIconStyle(item.href, isActive)}
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
                onMouseEnter={() => setHoveredHref(item.href)}
                onMouseLeave={() => setHoveredHref(null)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group",
                )}
                style={getNavStyle(item.href, isActive)}
              >
                <MaterialIcon
                  name={item.icon}
                  className="h-5 w-5 flex-shrink-0"
                  style={getIconStyle(item.href, isActive)}
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
        </div>

        {/* Collapse Toggle — desktop only */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-3 top-20 h-6 w-6 rounded-full border shadow-sm hover:bg-sidebar-accent hidden md:flex border-sidebar-border bg-sidebar text-sidebar-foreground"
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
    <header className="flex-shrink-0 z-30 h-16 bg-background border-b border-border flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-2 md:gap-4">
        {/* Mobile hamburger */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-11 w-11 text-foreground"
          onClick={onMobileMenuToggle}
        >
          <Menu className="h-5 w-5" />
        </Button>
        {/* Logo icon on mobile — full title too wide for phone header */}
        <KNLogo showText={false} size="sm" className="md:hidden" />
        <h1 className="hidden md:block text-lg font-semibold text-foreground">
          Guardian Financial Tool
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
            <Button variant="ghost" size="icon" className="relative">
              <Sun className="h-5 w-5 sun-icon text-foreground" />
              <Moon className="absolute h-5 w-5 moon-icon text-foreground" />
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative hidden sm:flex text-foreground">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 flex items-center justify-center text-[10px] rounded-full font-medium bg-brand-accent text-brand-accent-foreground">
                3
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="flex flex-col gap-1 p-1">
              <div className="flex items-start gap-3 p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors cursor-default">
                <div className="w-2 h-2 rounded-full bg-brand-accent mt-1.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">New report generated</p>
                  <p className="text-xs text-muted-foreground">Weekly reconciliation report is ready</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">2 minutes ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors cursor-default">
                <div className="w-2 h-2 rounded-full bg-brand-accent mt-1.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">Silent Arrears flagged</p>
                  <p className="text-xs text-muted-foreground">6 accounts detected in batch #48213</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">1 hour ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors cursor-default">
                <div className="w-2 h-2 rounded-full bg-brand-accent mt-1.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">System update complete</p>
                  <p className="text-xs text-muted-foreground">Guardian Financial Tool updated to v2.4.1</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">3 hours ago</p>
                </div>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer justify-center text-center text-primary">
              View all notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="h-8 w-px bg-border hidden sm:block" />

        {/* Profile Card */}
        <ProfileCard />
      </div>
    </header>
  );
}