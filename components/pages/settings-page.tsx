"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import {
  Settings,
  User,
  Bell,
  Shield,
  Database,
  Link,
  Key,
  Moon,
  Sun,
  Globe,
  Save,
  Server,
  ToggleLeft,
  ToggleRight,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApp } from "@/contexts/app-context";

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { demoMode, setDemoMode, backendConnected, backendUrl, setBackendUrl, user, updateUserProfile } = useApp();
  const [tempBackendUrl, setTempBackendUrl] = useState(backendUrl);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<"success" | "error" | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [phone, setPhone] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setFirstName(user.first_name ?? "");
    setLastName(user.last_name ?? "");
    setEmail(user.email ?? "");
    setDepartment(user.department ?? "");
    setPhone(user.phone ?? "");
  }, [user]);

  const profileUnchanged =
    !!user &&
    firstName === (user.first_name ?? "") &&
    lastName === (user.last_name ?? "") &&
    email === (user.email ?? "") &&
    department === (user.department ?? "") &&
    phone === (user.phone ?? "");

  const saveProfile = async () => {
    setIsSavingProfile(true);
    setProfileSaveError(null);
    try {
      await updateUserProfile({ first_name: firstName, last_name: lastName, email, department, phone });
      toast.success("Profile updated");
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setProfileSaveError(message);
      toast.error("Failed to update profile", { description: message });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const testConnection = async () => {
    setIsTestingConnection(true);
    setConnectionTestResult(null);

    try {
      const response = await fetch(`${tempBackendUrl}/api/health`, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });
      setConnectionTestResult(response.ok ? "success" : "error");
    } catch {
      setConnectionTestResult("error");
    } finally {
      setIsTestingConnection(false);
    }
  };

  const saveBackendUrl = () => {
    setBackendUrl(tempBackendUrl);
  };

  return (
    <div className="space-y-6 pb-2">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[#2B2B2B] flex items-center gap-3">
          <Settings className="h-7 w-7 text-[#0D3B8E]" />
          Settings
        </h2>
        <p className="text-[#6B7280] mt-1">
          Manage application settings, integrations, and preferences.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Demo Mode & Backend Settings */}
          <Card className="border-[#E5E7EB] bg-white">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Server className="h-5 w-5 text-[#0D3B8E]" />
                <CardTitle className="text-[#2B2B2B]">Data Source</CardTitle>
              </div>
              <CardDescription>Configure demo mode and backend connection</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Demo Mode Toggle */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-[#EEF2F7]/50 border border-[#E5E7EB]">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${demoMode ? "bg-amber-100 dark:bg-amber-900/50" : "bg-[#EEF2F7]"}`}>
                    {demoMode ? (
                      <ToggleRight className="h-5 w-5 text-[#F59E0B] dark:text-amber-400" />
                    ) : (
                      <ToggleLeft className="h-5 w-5 text-[#6B7280]" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-[#2B2B2B]">Demo Mode</p>
                    <p className="text-sm text-[#6B7280]">
                      {demoMode
                        ? "Using demo data and Grok AI for chat"
                        : "Connect to Django backend for live data"}
                    </p>
                  </div>
                </div>
                <Switch checked={demoMode} onCheckedChange={setDemoMode} />
              </div>

              {/* Backend URL Configuration */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="backend-url" className="text-base">Backend URL</Label>
                  <Badge
                    variant="secondary"
                    className={
                      demoMode
                        ? "bg-[#EEF2F7] text-[#6B7280]"
                        : backendConnected
                        ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
                        : "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300"
                    }
                  >
                    {demoMode ? (
                      "Demo Active"
                    ) : backendConnected ? (
                      <>
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Connected
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3 mr-1" />
                        Disconnected
                      </>
                    )}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Input
                    id="backend-url"
                    value={tempBackendUrl}
                    onChange={(e) => setTempBackendUrl(e.target.value)}
                    placeholder="http://localhost:8000"
                    disabled={demoMode}
                    className="flex-1 min-w-0"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={testConnection}
                      disabled={demoMode || isTestingConnection}
                    >
                      {isTestingConnection ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      onClick={saveBackendUrl}
                      disabled={demoMode || tempBackendUrl === backendUrl}
                    >
                      Save
                    </Button>
                  </div>
                </div>
                {connectionTestResult && (
                  <p
                    className={`text-sm ${
                      connectionTestResult === "success"
                        ? "text-[#10B981] dark:text-green-400"
                        : "text-[#ef4444] dark:text-red-400"
                    }`}
                  >
                    {connectionTestResult === "success"
                      ? "Connection successful!"
                      : "Connection failed. Check the URL and ensure the backend is running."}
                  </p>
                )}
                <p className="text-xs text-[#6B7280]">
                  The backend should expose /api/health for connection testing. When Demo Mode is off, data will be fetched from this URL.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Profile Settings */}
          <Card className="border-[#E5E7EB] bg-white">
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-[#0D3B8E]" />
                <CardTitle className="text-[#2B2B2B]">Profile Settings</CardTitle>
              </div>
              <CardDescription>Manage your account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="first-name">First Name</Label>
                  <Input id="first-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last-name">Last Name</Label>
                  <Input id="last-name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input id="department" value={department} onChange={(e) => setDepartment(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </div>
              {profileSaveError && (
                <p className="text-sm text-[#ef4444] dark:text-red-400">{profileSaveError}</p>
              )}
              <Button
                onClick={saveProfile}
                disabled={isSavingProfile || profileUnchanged}
              >
                {isSavingProfile ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Profile
              </Button>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="border-[#E5E7EB] bg-white">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-[#0D3B8E]" />
                <CardTitle className="text-[#2B2B2B]">Notifications</CardTitle>
              </div>
              <CardDescription>Configure alert and notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-[#2B2B2B]">Email Notifications</p>
                  <p className="text-sm text-[#6B7280]">
                    Receive email alerts for important events
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-[#2B2B2B]">Variance Alerts</p>
                  <p className="text-sm text-[#6B7280]">
                    Get notified when variances exceed threshold
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-[#2B2B2B]">Processing Complete</p>
                  <p className="text-sm text-[#6B7280]">
                    Notify when batch processing completes
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-[#2B2B2B]">Weekly Summary</p>
                  <p className="text-sm text-[#6B7280]">
                    Receive weekly performance digest
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          {/* Integrations */}
          <Card className="border-[#E5E7EB] bg-white">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Link className="h-5 w-5 text-[#0D3B8E]" />
                <CardTitle className="text-[#2B2B2B]">Integrations</CardTitle>
              </div>
              <CardDescription>Connect external systems and data sources</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { icon: Database, color: "bg-chart-3/10", iconColor: "text-chart-3", name: "ACON System", desc: "Invoice data source", status: "Connected", statusClass: "bg-chart-3/10 text-chart-3", action: "Configure", actionVariant: "outline" as const },
                { icon: Globe, color: "bg-chart-1/10", iconColor: "text-chart-1", name: "KRA Portal", desc: "Tax compliance data", status: "Connected", statusClass: "bg-chart-3/10 text-chart-3", action: "Configure", actionVariant: "outline" as const },
                { icon: Database, color: "bg-chart-2/10", iconColor: "text-chart-2", name: "Safaricom Billing", desc: "Telephone billing data", status: "Not connected", statusClass: "bg-[#EEF2F7] text-[#6B7280]", action: "Connect", actionVariant: "default" as const },
              ].map((item) => (
                <div key={item.name} className="flex flex-wrap items-center gap-3 p-3 rounded-lg bg-[#EEF2F7]/50">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`p-2 rounded-lg ${item.color} flex-shrink-0`}>
                      <item.icon className={`h-4 w-4 ${item.iconColor}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-[#2B2B2B]">{item.name}</p>
                      <p className="text-sm text-[#6B7280]">{item.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs px-2 py-1 rounded-full ${item.statusClass}`}>
                      {item.status}
                    </span>
                    <Button variant={item.actionVariant} size="sm" className={item.actionVariant === "default" ? "bg-[#0D3B8E] text-white hover:bg-[#0D3B8E]/90" : ""}>
                      {item.action}
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-6">
          {/* Security */}
          <Card className="border-[#E5E7EB] bg-white">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-[#0D3B8E]" />
                <CardTitle className="text-[#2B2B2B]">Security</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full justify-start">
                <Key className="h-4 w-4 mr-2" />
                Change Password
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Shield className="h-4 w-4 mr-2" />
                Two-Factor Auth
              </Button>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#2B2B2B]">Session Timeout</p>
                  <p className="text-xs text-[#6B7280]">Auto-logout after inactivity</p>
                </div>
                <Select defaultValue="30">
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 min</SelectItem>
                    <SelectItem value="30">30 min</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card className="border-[#E5E7EB] bg-white">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Moon className="h-5 w-5 text-[#0D3B8E]" />
                <CardTitle className="text-[#2B2B2B]">Appearance</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#2B2B2B]">Theme</p>
                  <p className="text-xs text-[#6B7280]">Choose color scheme</p>
                </div>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <div className="flex items-center gap-2">
                        <Sun className="h-4 w-4" />
                        Light
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center gap-2">
                        <Moon className="h-4 w-4" />
                        Dark
                      </div>
                    </SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#2B2B2B]">Compact Mode</p>
                  <p className="text-xs text-[#6B7280]">Reduce spacing</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button className="w-full bg-[#0D3B8E] text-white hover:bg-[#0D3B8E]/90">
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
