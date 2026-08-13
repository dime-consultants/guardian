"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  MoreHorizontal,
  Mail,
  Shield,
  CheckCircle2,
  XCircle,
  Edit,
  Trash2,
  Key,
  Server,
  RefreshCw,
  Building2,
  Calendar,
  Loader2,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useApp } from "@/contexts/app-context";
import Link from "next/link";
import { toast } from "sonner";

// Types
interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: "admin" | "manager" | "analyst" | "viewer";
  department: string;
  is_active: boolean;
  last_login?: string;
  date_joined: string;
  is_superuser?: boolean;
  is_staff?: boolean;
  organization?: number | null;
  organization_name?: string | null;
}

interface UserFormData {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  department: string;
  password?: string;
  is_active: boolean;
}

interface Department {
  id: number;
  name: string;
  description: string;
}

// Extended type for the current user from app context
interface AppContextUser {
  id?: number | string;
  username?: string;
  email?: string;
  role?: string;
  is_superuser?: boolean;
  is_staff?: boolean;
}

const roleColors: Record<string, string> = {
  admin: "bg-[#EEF2F7] text-[#0D3B8E]",
  manager: "bg-[#EEF2F7] text-[#1F5FBF]",
  analyst: "bg-[#EEF2F7] text-[#C8A248]",
  viewer: "bg-[#EEF2F7] text-[#6B7280]",
};

const roleLabels: Record<string, string> = {
  admin: "Administrator",
  manager: "Manager",
  analyst: "Financial Analyst",
  viewer: "Viewer",
};

const roleDescriptions: Record<string, string> = {
  admin: "Full system access, can manage users and settings",
  manager: "Can manage invoices, reports, and team workflows",
  analyst: "Can process data, generate reports, and analyze invoices",
  viewer: "Read-only access to dashboards and reports",
};

function PermissionDeniedState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="p-4 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
        <Lock className="h-10 w-10 text-[#ef4444] dark:text-red-400" />
      </div>
      <h3 className="text-xl font-semibold text-[#2B2B2B] mb-2">
        Access Restricted
      </h3>
      <p className="text-[#6B7280] text-center max-w-md mb-6">
        You don't have permission to access user management. This page is only
        available to administrators.
      </p>
      <Link href="/dashboard">
        <Button variant="outline">Return to Dashboard</Button>
      </Link>
    </div>
  );
}

function AwaitingBackendState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="p-4 rounded-full bg-[#EEF2F7] mb-4">
        <Server className="h-10 w-10 text-[#6B7280]" />
      </div>
      <h3 className="text-xl font-semibold text-[#2B2B2B] mb-2">
        Awaiting Backend Connection
      </h3>
      <p className="text-[#6B7280] text-center max-w-md mb-6">
        Connect to your Django backend to manage users, or enable Demo Mode to
        preview with sample data.
      </p>
      <Link href="/settings">
        <Button variant="outline">Configure Backend</Button>
      </Link>
    </div>
  );
}

// This is the main component - using default export
const UsersPage = () => {
  const { demoMode, backendConnected, apiFetch, user: currentUser } = useApp();
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formData, setFormData] = useState<UserFormData>({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    role: "analyst",
    department: "",
    is_active: true,
  });
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  // Check if current user has admin permissions
  const isAdmin = useCallback(() => {
    if (demoMode) return true;
    if (!currentUser) return false;

    const userData = currentUser as unknown as AppContextUser;
    const userRole = userData.role;
    const isSuperuser = userData.is_superuser;
    const isStaff = userData.is_staff;

    return userRole === "admin" || isSuperuser === true || isStaff === true;
  }, [demoMode, currentUser]);

  // Load users from backend
  const loadUsers = useCallback(async () => {
    if (!backendConnected || !apiFetch) return;

    if (!isAdmin()) {
      setHasPermission(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiFetch("users/");
      if (res.status === 403) {
        setHasPermission(false);
        toast.error("Access Denied", {
          description: "You don't have permission to view users.",
        });
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setUsers(data);
        setHasPermission(true);
      }
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Error", {
        description: "Failed to load users. Please check your connection.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [backendConnected, apiFetch, isAdmin]);

  // Load departments
  const loadDepartments = useCallback(async () => {
    if (!backendConnected || !apiFetch) return;

    try {
      const res = await apiFetch("users/departments/");
      if (res.ok) {
        const data = await res.json();
        setDepartments(data);
      } else {
        setDepartments([
          { id: 1, name: "Finance", description: "Financial operations" },
          { id: 2, name: "Accounts", description: "Accounting department" },
          { id: 3, name: "Tax", description: "Tax compliance" },
          { id: 4, name: "Operations", description: "Business operations" },
          { id: 5, name: "IT", description: "Information technology" },
        ]);
      }
    } catch (error) {
      console.error("Error loading departments:", error);
    }
  }, [backendConnected, apiFetch]);

  // Create new user
  const createUser = async () => {
    if (!backendConnected || !apiFetch) return;

    setIsSubmitting(true);
    try {
      const res = await apiFetch("users/", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const newUser = await res.json();
        setUsers((prev) => [newUser, ...prev]);
        setShowAddDialog(false);
        resetForm();
        toast.success("User Created", {
          description: `${formData.first_name} ${formData.last_name} has been added.`,
        });
      } else if (res.status === 400) {
        const error = await res.json();
        const errorMessages = Object.values(error).flat().join(", ");
        toast.error("Validation Error", {
          description: errorMessages,
        });
      } else if (res.status === 403) {
        toast.error("Permission Denied", {
          description: "You don't have permission to create users.",
        });
      } else {
        toast.error("Error", {
          description: "Failed to create user. Please try again.",
        });
      }
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error("Error", {
        description: "Failed to create user. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update user
  const updateUser = async () => {
    if (!backendConnected || !apiFetch || !selectedUser) return;

    setIsSubmitting(true);
    try {
      const res = await apiFetch(`users/${selectedUser.id}/`, {
        method: "PATCH",
        body: JSON.stringify({
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          role: formData.role,
          department: formData.department || null,
          is_active: formData.is_active,
        }),
      });

      if (res.ok) {
        const updatedUser = await res.json();
        setUsers((prev) =>
          prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)),
        );
        setShowEditDialog(false);
        resetForm();
        toast.success("User Updated", {
          description: `${formData.first_name} ${formData.last_name} has been updated.`,
        });
      } else if (res.status === 403) {
        toast.error("Permission Denied", {
          description: "You don't have permission to edit users.",
        });
      } else {
        toast.error("Error", {
          description: "Failed to update user. Please try again.",
        });
      }
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Error", {
        description: "Failed to update user. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete user
  const deleteUser = async () => {
    if (!backendConnected || !apiFetch || !selectedUser) return;

    setIsSubmitting(true);
    try {
      const res = await apiFetch(`users/${selectedUser.id}/`, {
        method: "DELETE",
      });

      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== selectedUser.id));
        setShowDeleteDialog(false);
        setSelectedUser(null);
        toast.success("User Deleted", {
          description: `${selectedUser.full_name} has been removed.`,
        });
      } else if (res.status === 403) {
        toast.error("Permission Denied", {
          description: "You don't have permission to delete users.",
        });
      } else {
        toast.error("Error", {
          description: "Failed to delete user. Please try again.",
        });
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Error", {
        description: "Failed to delete user. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset user password
  const resetPassword = async () => {
    if (!backendConnected || !apiFetch || !selectedUser) return;

    if (newPassword !== confirmPassword) {
      toast.error("Password Mismatch", {
        description: "New password and confirmation do not match.",
      });
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password Too Short", {
        description: "Password must be at least 8 characters long.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiFetch(`users/${selectedUser.id}/reset-password/`, {
        method: "POST",
        body: JSON.stringify({ password: newPassword }),
      });

      if (res.ok) {
        setShowResetPasswordDialog(false);
        setNewPassword("");
        setConfirmPassword("");
        toast.success("Password Reset", {
          description: `Password has been reset for ${selectedUser.full_name}.`,
        });
      } else if (res.status === 403) {
        toast.error("Permission Denied", {
          description: "You don't have permission to reset passwords.",
        });
      } else {
        toast.error("Error", {
          description: "Failed to reset password. Please try again.",
        });
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      toast.error("Error", {
        description: "Failed to reset password. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle user status
  const toggleUserStatus = async (user: User) => {
    if (!backendConnected || !apiFetch) return;

    try {
      const res = await apiFetch(`users/${user.id}/`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: !user.is_active }),
      });

      if (res.ok) {
        const updatedUser = await res.json();
        setUsers((prev) =>
          prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)),
        );
        toast.success("Status Updated", {
          description: `${user.full_name} has been ${!user.is_active ? "activated" : "deactivated"}.`,
        });
      } else if (res.status === 403) {
        toast.error("Permission Denied", {
          description: "You don't have permission to change user status.",
        });
      }
    } catch (error) {
      console.error("Error toggling user status:", error);
      toast.error("Error", {
        description: "Failed to update user status.",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      username: "",
      email: "",
      first_name: "",
      last_name: "",
      role: "analyst",
      department: "",
      is_active: true,
    });
    setSelectedUser(null);
    setNewPassword("");
    setConfirmPassword("");
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      department: user.department || "",
      is_active: user.is_active,
    });
    setShowEditDialog(true);
  };

  const openDeleteDialog = (user: User) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
  };

  const openResetPasswordDialog = (user: User) => {
    setSelectedUser(user);
    setNewPassword("");
    setConfirmPassword("");
    setShowResetPasswordDialog(true);
  };

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = filterRole === "all" || user.role === filterRole;
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && user.is_active) ||
      (filterStatus === "inactive" && !user.is_active);

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Calculate stats
  const stats = {
    total: users.length,
    active: users.filter((u) => u.is_active).length,
    admins: users.filter((u) => u.role === "admin").length,
    departments: new Set(users.map((u) => u.department).filter(Boolean)).size,
  };

  // Initialize
  useEffect(() => {
    if (!demoMode && backendConnected) {
      loadUsers();
      loadDepartments();
    }
  }, [demoMode, backendConnected, loadUsers, loadDepartments]);

  // Show loading state while checking permissions
  if (backendConnected && !demoMode && hasPermission === null && !isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-[#6B7280]" />
      </div>
    );
  }

  // Show permission denied state
  if (backendConnected && !demoMode && hasPermission === false) {
    return <PermissionDeniedState />;
  }

  const showEmptyState = !demoMode && !backendConnected;

  if (showEmptyState) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[#2B2B2B] flex items-center gap-3">
              <Users className="h-7 w-7 text-[#0D3B8E]" />
              User Management
            </h2>
            <p className="text-[#6B7280] mt-1">
              Manage user accounts, roles, and permissions.
            </p>
          </div>
        </div>
        <Card className="border-[#E5E7EB] bg-white">
          <AwaitingBackendState />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-[#2B2B2B] flex items-center gap-2 md:gap-3">
            <Users className="h-6 md:h-7 w-6 md:w-7 text-[#0D3B8E] flex-shrink-0" />
            User Management
          </h2>
          <p className="text-[#6B7280] mt-1 text-sm line-clamp-2">
            Manage user accounts, roles, permissions, and access control.
          </p>
        </div>
        <div className="flex items-center gap-2 sm:flex-shrink-0">
          {demoMode && (
            <Badge
              variant="secondary"
              className="bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300"
            >
              Demo Data
            </Badge>
          )}
          {!demoMode && backendConnected && (
            <Badge
              variant="secondary"
              className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
            >
              Live Data
            </Badge>
          )}
          <Button
            variant="outline"
            size="icon"
            onClick={loadUsers}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
          <Button
            className="bg-[#0D3B8E] text-white hover:bg-[#0D3B8E]/90"
            onClick={() => setShowAddDialog(true)}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="border-[#E5E7EB] bg-white p-4 gap-0">
          <CardContent className="p-0">
            <div className="text-2xl md:text-3xl font-bold text-[#2B2B2B]">{stats.total}</div>
            <p className="text-sm text-[#6B7280] mt-0.5">Total Users</p>
          </CardContent>
        </Card>
        <Card className="border-[#E5E7EB] bg-white p-4 gap-0">
          <CardContent className="p-0">
            <div className="text-2xl md:text-3xl font-bold text-[#2B2B2B]">{stats.active}</div>
            <p className="text-sm text-[#6B7280] mt-0.5">Active Users</p>
          </CardContent>
        </Card>
        <Card className="border-[#E5E7EB] bg-white p-4 gap-0">
          <CardContent className="p-0">
            <div className="text-2xl md:text-3xl font-bold text-[#2B2B2B]">{stats.admins}</div>
            <p className="text-sm text-[#6B7280] mt-0.5">Administrators</p>
          </CardContent>
        </Card>
        <Card className="border-[#E5E7EB] bg-white p-4 gap-0">
          <CardContent className="p-0">
            <div className="text-2xl md:text-3xl font-bold text-[#2B2B2B]">{stats.departments}</div>
            <p className="text-sm text-[#6B7280] mt-0.5">Departments</p>
          </CardContent>
        </Card>
      </div>

      {/* User List Card - Simplified for brevity, same as before */}
      <Card className="border-[#E5E7EB] bg-white">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-[#2B2B2B]">
                Team Members
              </CardTitle>
              <CardDescription>Manage access and permissions</CardDescription>
            </div>
            <div className="flex items-center gap-2 sm:flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6B7280]" />
                <Input
                  placeholder="Search users..."
                  className="pl-9 w-full sm:w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {showFilters && (
            <div className="flex gap-4 mt-4 pt-4 border-t border-[#E5E7EB] flex-wrap">
              <div className="flex-1 min-w-[150px]">
                <Label className="text-xs">Role</Label>
                <Select value={filterRole} onValueChange={setFilterRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="analyst">Analyst</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 min-w-[150px]">
                <Label className="text-xs">Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFilterRole("all");
                    setFilterStatus("all");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#6B7280]" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto mb-4 text-[#6B7280] opacity-50" />
              <p className="text-[#6B7280]">No users found</p>
              <Button
                variant="link"
                onClick={() => setShowAddDialog(true)}
                className="mt-2"
              >
                Add your first user
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-4 p-4 rounded-lg bg-[#EEF2F7]/50 hover:bg-[#EEF2F7] transition-colors group"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-[#0D3B8E]/10 text-[#0D3B8E]">
                      {user.full_name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-medium text-[#2B2B2B]">
                        {user.full_name}
                      </span>
                      <span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full capitalize",
                          roleColors[user.role],
                        )}
                      >
                        {roleLabels[user.role]}
                      </span>
                      {user.is_active ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-[#ef4444]" />
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-[#6B7280] flex-wrap">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {user.email}
                      </span>
                      {user.department && (
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {user.department}
                        </span>
                      )}
                      {user.organization_name && (
                        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#EEF2F7] text-[#0D3B8E]">
                          {user.organization_name}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Joined {new Date(user.date_joined).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-[#6B7280]">Last active</p>
                    <p className="text-sm text-[#2B2B2B]">
                      {user.last_login
                        ? new Date(user.last_login).toLocaleDateString()
                        : "Never"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 touch-expand"
                      onClick={() => openEditDialog(user)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9 touch-expand">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => toggleUserStatus(user)}
                        >
                          {user.is_active ? (
                            <>
                              <XCircle className="h-4 w-4 mr-2" />
                              Deactivate User
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Activate User
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => openResetPasswordDialog(user)}
                        >
                          <Key className="h-4 w-4 mr-2" />
                          Reset Password
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => openDeleteDialog(user)}
                          className="text-[#ba1a1a] focus:text-[#ba1a1a]"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account. They will need to use the temporary
              password to log in.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name *</Label>
                <Input
                  value={formData.first_name}
                  onChange={(e) =>
                    setFormData({ ...formData, first_name: e.target.value })
                  }
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name *</Label>
                <Input
                  value={formData.last_name}
                  onChange={(e) =>
                    setFormData({ ...formData, last_name: e.target.value })
                  }
                  placeholder="Doe"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Username *</Label>
              <Input
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                placeholder="johndoe"
              />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="john.doe@company.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Temporary Password *</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={formData.password || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="Create a temporary password"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-[#6B7280]">
                Password must be at least 8 characters long.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Role *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(v) => setFormData({ ...formData, role: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="analyst">Financial Analyst</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-[#6B7280] mt-1">
                  {roleDescriptions[formData.role]}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Select
                  value={formData.department || "none"}
                  onValueChange={(v) =>
                    setFormData({
                      ...formData,
                      department: v === "none" ? "" : v,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.name}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={createUser} disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and permissions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input
                  value={formData.first_name}
                  onChange={(e) =>
                    setFormData({ ...formData, first_name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input
                  value={formData.last_name}
                  onChange={(e) =>
                    setFormData({ ...formData, last_name: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(v) => setFormData({ ...formData, role: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="analyst">Financial Analyst</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Select
                  value={formData.department || "none"}
                  onValueChange={(v) =>
                    setFormData({
                      ...formData,
                      department: v === "none" ? "" : v,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.name}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData({ ...formData, is_active: e.target.checked })
                }
                className="rounded border-[#E5E7EB]"
              />
              <Label htmlFor="is_active">Account Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={updateUser} disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedUser?.full_name}? This
              action cannot be undone. All data associated with this user will
              be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteUser}
              className="bg-[#ba1a1a] text-white hover:bg-[#ba1a1a]/90"
            >
              {isSubmitting && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Password Dialog */}
      <Dialog
        open={showResetPasswordDialog}
        onOpenChange={setShowResetPasswordDialog}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Set a new password for {selectedUser?.full_name}. The user will
              need to use this password to log in.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>New Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Confirm Password</Label>
              <Input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
            {newPassword &&
              confirmPassword &&
              newPassword !== confirmPassword && (
                <p className="text-sm text-[#ef4444]">Passwords do not match</p>
              )}
            {newPassword && newPassword.length < 8 && (
              <p className="text-sm text-[#ef4444]">
                Password must be at least 8 characters
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowResetPasswordDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={resetPassword}
              disabled={
                isSubmitting ||
                !newPassword ||
                newPassword !== confirmPassword ||
                newPassword.length < 8
              }
            >
              {isSubmitting && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Reset Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Default export at the bottom
export default UsersPage;
