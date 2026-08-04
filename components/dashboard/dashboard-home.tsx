"use client";

import { useState, useEffect } from "react";
import {
  Brain,
  MessageSquare,
  Wrench,
  Upload,
  FileSpreadsheet,
  BarChart3,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Zap,
  Loader2,
  WifiOff,
  Server,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useApp } from "@/contexts/app-context";

// Demo data
const demoStatsCards = [
  {
    title: "Invoices Processed",
    value: "2,847",
    change: "+12.5%",
    changeType: "positive" as const,
    icon: FileText,
    description: "This month",
  },
  {
    title: "Time Saved",
    value: "142 hrs",
    change: "+23.1%",
    changeType: "positive" as const,
    icon: Clock,
    description: "Automation efficiency",
  },
  {
    title: "Reconciliations",
    value: "98.7%",
    change: "+2.3%",
    changeType: "positive" as const,
    icon: CheckCircle2,
    description: "Accuracy rate",
  },
  {
    title: "Pending Reviews",
    value: "23",
    change: "-8",
    changeType: "negative" as const,
    icon: AlertCircle,
    description: "Requires attention",
  },
];

const quickActions = [
  {
    title: "AI Engine",
    description: "AI-powered data analysis, variance detection, and automated insights generation for invoice reconciliation.",
    href: "/ai-engine",
    icon: Brain,
    color: "bg-chart-1/10 text-chart-1",
  },
  {
    title: "Chat Assistant",
    description: "Interactive AI assistant for real-time queries, report requests, and workflow automation guidance.",
    href: "/chat",
    icon: MessageSquare,
    color: "bg-chart-2/10 text-chart-2",
  },
  {
    title: "Data Tools",
    description: "Convert TXT to XLSX, clean data formats, and perform automated data transformations.",
    href: "/tools",
    icon: Wrench,
    color: "bg-chart-3/10 text-chart-3",
  },
  {
    title: "File Manager",
    description: "Upload invoice files, manage document storage, and organize billing data from vendors.",
    href: "/uploads",
    icon: Upload,
    color: "bg-chart-4/10 text-chart-4",
  },
  {
    title: "Reports",
    description: "Access generated reports, daily/weekly/monthly summaries, and reconciliation outputs.",
    href: "/reports",
    icon: FileSpreadsheet,
    color: "bg-chart-5/10 text-chart-5",
  },
  {
    title: "Analytics",
    description: "Performance dashboards, processing metrics, and automation efficiency tracking.",
    href: "/analytics",
    icon: BarChart3,
    color: "bg-chart-1/10 text-chart-1",
  },
];

const demoProcessingData = [
  { name: "Mon", invoices: 420, reconciled: 415 },
  { name: "Tue", invoices: 380, reconciled: 375 },
  { name: "Wed", invoices: 510, reconciled: 502 },
  { name: "Thu", invoices: 470, reconciled: 468 },
  { name: "Fri", invoices: 520, reconciled: 515 },
  { name: "Sat", invoices: 180, reconciled: 180 },
  { name: "Sun", invoices: 90, reconciled: 90 },
];

const demoRecentActivity = [
  {
    id: 1,
    action: "Invoice batch processed",
    description: "247 invoices from ACON system",
    time: "2 minutes ago",
    status: "success" as const,
  },
  {
    id: 2,
    action: "Telephone billing report",
    description: "May 2024 - 577 pages processed",
    time: "15 minutes ago",
    status: "success" as const,
  },
  {
    id: 3,
    action: "Variance detected",
    description: "12 invoices flagged for review",
    time: "1 hour ago",
    status: "warning" as const,
  },
  {
    id: 4,
    action: "KRA reconciliation complete",
    description: "Daily tax compliance verified",
    time: "2 hours ago",
    status: "success" as const,
  },
  {
    id: 5,
    action: "Data conversion",
    description: "TXT to XLSX - 1,200 records",
    time: "3 hours ago",
    status: "success" as const,
  },
];

interface StatsCard {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative";
  icon: typeof FileText;
  description: string;
}

interface ActivityItem {
  id: number;
  action: string;
  description: string;
  time: string;
  status: "success" | "warning" | "error";
}

interface ProcessingDataPoint {
  name: string;
  invoices: number;
  reconciled: number;
}

function EmptyStateCard({ title, icon: Icon }: { title: string; icon: typeof FileText }) {
  return (
    <Card className="border-border bg-card relative overflow-hidden py-3 md:py-6 gap-3 md:gap-6">
      <CardHeader className="flex flex-row items-center justify-between px-3 md:px-6 pb-1">
        <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground leading-tight">
          {title}
        </CardTitle>
        <div className="p-1.5 md:p-2 rounded-lg bg-muted flex-shrink-0">
          <Icon className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="px-3 md:px-6">
        <div className="text-xl md:text-2xl font-bold text-muted-foreground">--</div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground">No data</span>
        </div>
      </CardContent>
    </Card>
  );
}

function AwaitingBackendState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="p-4 rounded-full bg-muted mb-4">
        <Server className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">
        Awaiting Backend Connection
      </h3>
      <p className="text-muted-foreground text-center max-w-md mb-6">
        Connect to your Django backend to view live data, or enable Demo Mode to preview the interface with sample data.
      </p>
      <div className="flex items-center gap-3">
        <Link href="/settings">
          <Button variant="outline">
            Configure Backend
          </Button>
        </Link>
      </div>
    </div>
  );
}
export function DashboardHome() {
  const { demoMode, backendConnected, backendUrl, apiFetch } = useApp();
  const [statsCards, setStatsCards] = useState<StatsCard[]>([]);
  const [processingData, setProcessingData] = useState<ProcessingDataPoint[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (demoMode) {
      setStatsCards(demoStatsCards);
      setProcessingData(demoProcessingData);
      setRecentActivity(demoRecentActivity);
      return;
    }

    // When not in demo mode and not connected, show empty state
    if (!backendConnected) {
      setStatsCards([]);
      setProcessingData([]);
      setRecentActivity([]);
      return;
    }

    // Fetch from backend when connected
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const statsRes = await apiFetch("dashboard/stats/");
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          if (statsData.stats) {
            setStatsCards(statsData.stats.map((s: Record<string, unknown>) => ({
              ...s,
              icon: getIconForStat(s.title as string),
            })));
          }
        }

        const processingRes = await apiFetch("dashboard/processing/");
        if (processingRes.ok) {
          const processingDataResult = await processingRes.json();
          if (processingDataResult.data) {
            setProcessingData(processingDataResult.data);
          }
        }

        const activityRes = await apiFetch("dashboard/activity/");
        if (activityRes.ok) {
          const activityData = await activityRes.json();
          if (activityData.activities) {
            setRecentActivity(activityData.activities);
          }
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 60000);
    return () => clearInterval(interval);
  }, [demoMode, backendConnected, backendUrl]);

  const getIconForStat = (title: string) => {
    const iconMap: Record<string, typeof FileText> = {
      "Invoices Processed": FileText,
      "Time Saved": Clock,
      "Reconciliations": CheckCircle2,
      "Pending Reviews": AlertCircle,
    };
    return iconMap[title] || FileText;
  };

  const showEmptyState = !demoMode && !backendConnected;

  return (
    <div className="space-y-6 pb-2">
      <section className="relative overflow-hidden rounded-[32px] border border-blue-100 bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_50%,#dbeafe_100%)] p-5 md:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.16),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.22),transparent_34%)]" />
        <div className="absolute right-6 top-6 h-24 w-24 rounded-full bg-blue-400/20 blur-2xl" />
        <div className="absolute left-8 bottom-4 h-28 w-28 rounded-full bg-blue-200/40 blur-3xl" />

        <div className="relative z-10 grid gap-6 lg:grid-cols-[1.25fr_0.9fr] lg:items-center">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-700 shadow-sm">
              Guardian Bank Digital Platform
            </div>

            <div className="space-y-3">
              <h1 className="max-w-2xl text-4xl font-black tracking-[-0.05em] text-blue-950 sm:text-5xl md:text-6xl">
                Banking at the speed of intelligence.
              </h1>
              <p className="max-w-xl text-base text-blue-800 md:text-lg">
                A secure, premium banking workspace for customer operations, account oversight, and AI-powered financial workflows.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button className="bg-blue-900 text-white hover:bg-blue-800 rounded-full px-6 py-5 shadow-lg shadow-blue-900/15">
                Explore Services
              </Button>
              <Button variant="outline" className="rounded-full border-blue-300 bg-white text-blue-900 hover:bg-blue-50 px-6 py-5">
                Book a Demo
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-blue-200 bg-white/85 p-3">
                <div className="text-lg font-bold text-blue-950">24/7</div>
                <div className="text-xs text-blue-700">Secure monitoring</div>
              </div>
              <div className="rounded-2xl border border-blue-200 bg-white/85 p-3">
                <div className="text-lg font-bold text-blue-950">98.7%</div>
                <div className="text-xs text-blue-700">Workflow accuracy</div>
              </div>
              <div className="rounded-2xl border border-blue-200 bg-white/85 p-3">
                <div className="text-lg font-bold text-blue-950">142 hrs</div>
                <div className="text-xs text-blue-700">Time saved monthly</div>
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-[#348fe2]/20 bg-white/90 p-4 shadow-[0_20px_70px_rgba(52,143,226,0.16)] backdrop-blur-md">
            <div className="rounded-[28px] bg-[linear-gradient(145deg,#348fe2_0%,#246fbe_100%)] p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="text-[10px] font-semibold uppercase tracking-[0.32em] text-white/80">
                  Operations Snapshot
                </div>
                <div className="rounded-full border border-white/30 bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em]">
                  Live
                </div>
              </div>

              <div className="mt-5 rounded-[24px] bg-[#F5FAFE] p-4 text-[#348fe2] shadow-inner shadow-[#348fe2]/10">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#348fe2]/75">
                      Processing speed
                    </div>
                    <div className="mt-2 text-3xl font-black tracking-[-0.05em]">1.8x faster</div>
                  </div>
                  <div className="rounded-full bg-[#348fe2] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-white">
                    Smart lane
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[20px] border border-white/20 bg-white/10 p-3">
                  <div className="text-[10px] uppercase tracking-[0.24em] text-white/70">Requests</div>
                  <div className="mt-2 text-2xl font-bold">2,847</div>
                </div>
                <div className="rounded-[20px] border border-white/20 bg-white/10 p-3">
                  <div className="text-[10px] uppercase tracking-[0.24em] text-white/70">Alerts</div>
                  <div className="mt-2 text-2xl font-bold">23</div>
                </div>
              </div>

              <div className="mt-4 rounded-[20px] bg-white/10 p-3 backdrop-blur-sm">
                <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.24em] text-white/75">
                  <span>Monthly throughput</span>
                  <span>+12.5%</span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-white/20">
                  <div className="h-2 w-[78%] rounded-full bg-[#F5FAFE]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {showEmptyState ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:grid-cols-4">
            <EmptyStateCard title="Invoices Processed" icon={FileText} />
            <EmptyStateCard title="Time Saved" icon={Clock} />
            <EmptyStateCard title="Reconciliations" icon={CheckCircle2} />
            <EmptyStateCard title="Pending Reviews" icon={AlertCircle} />
          </div>

          <div className="grid gap-4 lg:grid-cols-7">
            <Card className="lg:col-span-4 border-border bg-card">
              <CardHeader>
                <CardTitle className="text-card-foreground">Weekly Processing Overview</CardTitle>
                <CardDescription>Invoice processing and reconciliation trends</CardDescription>
              </CardHeader>
              <CardContent>
                <AwaitingBackendState />
              </CardContent>
            </Card>

            <Card className="lg:col-span-3 border-border bg-card">
              <CardHeader>
                <CardTitle className="text-card-foreground">Recent Activity</CardTitle>
                <CardDescription>Latest automation events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <WifiOff className="h-8 w-8 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">No activity data available</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:grid-cols-4">
            {statsCards.map((stat) => {
              const IconComponent = stat.icon;
              return (
                <Card key={stat.title} className="border-blue-100 bg-white relative overflow-hidden py-4 md:py-6 gap-3 md:gap-6 shadow-[0_10px_30px_rgba(37,99,235,0.07)]">
                  {isLoading && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-700" />
                    </div>
                  )}
                  <CardHeader className="flex flex-row items-center justify-between px-4 md:px-6 pb-1">
                    <CardTitle className="text-sm font-medium text-blue-800 leading-tight">
                      {stat.title}
                    </CardTitle>
                    <div className="p-2 rounded-lg flex-shrink-0 bg-blue-50">
                      <IconComponent className="h-4 w-4 text-blue-700" />
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 md:px-6">
                    <div className="text-2xl md:text-3xl font-bold text-blue-950">{stat.value}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-medium text-blue-700">{stat.change}</span>
                      <span className="text-xs text-blue-800/70">{stat.description}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="grid gap-4 lg:grid-cols-7">
            <Card className="lg:col-span-4 border-blue-100 bg-white relative overflow-hidden shadow-[0_10px_30px_rgba(37,99,235,0.07)]">
              {isLoading && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-700" />
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-blue-950">Weekly Processing Overview</CardTitle>
                <CardDescription>Invoice processing and reconciliation trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={processingData}>
                      <defs>
                        <linearGradient id="invoicesGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-blue-100" />
                      <XAxis dataKey="name" className="text-blue-900" fontSize={12} />
                      <YAxis className="text-blue-900" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#ffffff",
                          border: "1px solid #bfdbfe",
                          borderRadius: "8px",
                          color: "#0f172a",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="invoices"
                        stroke="#2563eb"
                        fill="url(#invoicesGradient)"
                        strokeWidth={2}
                        name="Invoices"
                      />
                      <Area
                        type="monotone"
                        dataKey="reconciled"
                        stroke="#1d4ed8"
                        fill="#bfdbfe"
                        strokeWidth={2}
                        name="Reconciled"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-3 border-blue-100 bg-white relative overflow-hidden shadow-[0_10px_30px_rgba(37,99,235,0.07)]">
              {isLoading && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-700" />
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-blue-950">Recent Activity</CardTitle>
                <CardDescription>Latest automation events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/50 p-2.5">
                      <div className="mt-1 h-2 w-2 rounded-full flex-shrink-0 bg-blue-700" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-blue-950">{activity.action}</p>
                        <p className="text-xs text-blue-800 truncate">{activity.description}</p>
                      </div>
                      <span className="text-xs text-blue-700 whitespace-nowrap">{activity.time}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <div>
        <div className="mb-3 md:mb-4 flex items-center justify-between gap-4">
          <h3 className="text-base md:text-lg font-semibold text-blue-950">Quick Actions</h3>
          <div className="hidden md:flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">
            <span className="h-2 w-2 rounded-full bg-blue-700" />
            Studio Access
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory md:grid md:gap-4 md:grid-cols-2 md:overflow-visible lg:grid-cols-3">
          {quickActions.map((action) => (
            <Link key={action.title} href={action.href} className="flex-shrink-0 w-[42vw] min-w-[148px] max-w-[176px] snap-start md:w-auto md:max-w-none">
              <Card className="h-full border border-[#348fe2]/15 bg-[#F5FAFE] hover:border-[#348fe2]/40 hover:shadow-[0_18px_40px_rgba(52,143,226,0.16)] transition-all cursor-pointer group rounded-[24px]">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-[#348fe2] text-white shadow-sm">
                      <action.icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-sm text-[#0b4f9f] group-hover:text-[#348fe2] transition-colors leading-snug">
                      {action.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs md:text-sm text-[#1f5f9d] leading-relaxed line-clamp-3">
                    {action.description}
                  </p>
                  <div className="flex items-center gap-1 mt-3 text-[#348fe2] text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Open <ArrowRight className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
