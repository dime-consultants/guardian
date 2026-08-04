"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, User, Mail, Shield, Edit2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/app-context";
import { cn } from "@/lib/utils";

export function ProfileCard() {
  const router = useRouter();
  const { user, logout } = useApp();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await logout();
      setIsOpen(false);
      router.push("/auth/login");
    } catch (error) {
      console.error("Logout failed:", error);
      router.push("/auth/login");
    }
  };

  const handleEditProfile = () => {
    router.push("/settings");
    setIsOpen(false);
  };

  const displayName = user.name || user.username || user.email || "User";
  const initials = displayName
    .trim()
    .split(/\s+/)
    .map((n) => n[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-10 rounded-full p-0 hover:bg-muted"
        >
          <Avatar className="h-10 w-10 border-2 border-primary/50 hover:border-primary cursor-pointer">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56 bg-card border-border">
        {/* User Info Section */}
        <div className="px-3 py-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-primary/50">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
          {user.role && (
            <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">
              <Shield className="h-3 w-3" />
              {user.role}
            </div>
          )}
        </div>

        <DropdownMenuSeparator className="my-2 bg-border" />

        {/* Menu Items */}
        <DropdownMenuItem
          onClick={handleEditProfile}
          className="flex items-center gap-2 cursor-pointer text-foreground hover:bg-muted"
        >
          <Edit2 className="h-4 w-4" />
          <span>Edit Profile</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          asChild
          className="flex items-center gap-2 cursor-pointer text-foreground hover:bg-muted"
        >
          <a href="/settings">
            <User className="h-4 w-4" />
            <span>Account Settings</span>
          </a>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-2 bg-border" />

        {/* Logout */}
        <DropdownMenuItem
          onClick={handleLogout}
          className="flex items-center gap-2 cursor-pointer text-destructive hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
