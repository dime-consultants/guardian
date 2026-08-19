"use client";

import { useState, useEffect } from "react";
import type { CSSProperties } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

/** Renders a Google Material Symbols Outlined glyph — same icon font Stitch uses. */
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

/**
 * ── Guardian Financial Tool (GFT) ──────────────────────────────────────
 * Manual reconciliation layer sitting outside BRNET (Craft Silicon). BRNET
 * has been miscalculating loan interest since its June 2024 launch — most
 * urgently on Ordinary Loan (TL101). GFT re-derives what each account's
 * arrears/interest SHOULD be (installment due vs. amount serviced, drawing
 * power vs. outstanding) and flags mismatches into three known patterns:
 *   - Silent Arrears     — arrears exist, BRNET shows the account as clean
 *   - Dormant Penalty     — arrears visible, but default rate isn't accruing
 *   - Miscalculated Arrears — arrears present, but the computed amount is wrong
 * Target: 100% TL101 account scrutiny for June (excluding IPF). ~10% of
 * accounts checked so far show one of the three patterns above.
 * ────────────────────────────────────────────────────────────────────── */

// Demo data
const demoStatsCards = [
  {
    title: "Accounts Scrutinized",
    value: "412",
    change: "10%",
    changeType: "positive" as const,
    icon: "fact_check",
    description: "of June TL101 target (4,120)",
  },
  {
    title: "Silent Arrears",
    value: "18",
    change: "+6",
    changeType: "negative" as const,
    icon: "visibility_off",
    description: "Arrears present, not flagged by BRNET",
  },
  {
    title: "Dormant Penalty",
    value: "11",
    change: "+3",
    changeType: "negative" as const,
    icon: "toggle_off",
    description: "Default rate not accruing on arrears",
  },
  {
    title: "Miscalculated Arrears",
    value: "9",
    change: "+2",
    changeType: "negative" as const,
    icon: "calculate",
    description: "Arrears amount computed incorrectly",
  },
];

const quickActions = [
  {
    title: "AI Engine",
    description: "AI-powered data analysis, variance detection, and automated insights generation for invoice reconciliation.",
    href: "/ai-engine",
    icon: "psychology",
  },
  {
    title: "Chat Assistant",
    description: "Interactive AI assistant for real-time queries, report requests, and workflow automation guidance.",
    href: "/chat",
    icon: "chat_bubble",
  },
  {
    title: "Data Tools",
    description: "Convert TXT to XLSX, clean data formats, and perform automated data transformations.",
    href: "/tools",
    icon: "build",
  },
  {
    title: "File Manager",
    description: "Upload invoice files, manage document storage, and organize billing data from vendors.",
    href: "/uploads",
    icon: "folder",
  },
  {
    title: "Reports",
    description: "Access generated reports, daily/weekly/monthly summaries, and reconciliation outputs.",
    href: "/reports",
    icon: "summarize",
  },
  {
    title: "Analytics",
    description: "Performance dashboards, processing metrics, and automation efficiency tracking.",
    href: "/analytics",
    icon: "insights",
  },
];

const demoProcessingData = [
  { name: "Mon", scrutinized: 62, flagged: 5 },
  { name: "Tue", scrutinized: 58, flagged: 7 },
  { name: "Wed", scrutinized: 71, flagged: 4 },
  { name: "Thu", scrutinized: 65, flagged: 8 },
  { name: "Fri", scrutinized: 74, flagged: 6 },
  { name: "Sat", scrutinized: 22, flagged: 1 },
  { name: "Sun", scrutinized: 10, flagged: 0 },
];

const demoRecentActivity = [
  {
    id: 1,
    title: "Silent Arrears flagged — TL101 #48213",
    description: "Drawing power below outstanding; BRNET shows no arrears.",
    timestamp: "12 minutes ago",
    status: "warning" as const,
  },
  {
    id: 2,
    title: "Batch scrutiny complete",
    description: "62 TL101 accounts checked against Guardian Financial Tool.",
    timestamp: "1 hour ago",
    status: "success" as const,
  },
  {
    id: 3,
    title: "Miscalculated Arrears flagged — TL101 #33876",
    description: "BRNET arrears amount does not match expected installment shortfall.",
    timestamp: "2 hours ago",
    status: "error" as const,
  },
  {
    id: 4,
    title: "Dormant Penalty flagged — TL101 #51002",
    description: "Account in arrears; default rate not accruing in BRNET.",
    timestamp: "3 hours ago",
    status: "warning" as const,
  },
  {
    id: 5,
    title: "BRNET export synced",
    description: "Nightly account statement and loan schedule export processed.",
    timestamp: "Yesterday, 11:59 PM",
    status: "success" as const,
  },
];

interface StatsCard {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative";
  icon: string; // Material Symbols glyph name
  description: string;
}

interface ActivityItem {
  id: string | number;
  title: string;
  description: string;
  timestamp: string;
  status: "success" | "warning" | "error" | "pending";
}

interface ProcessingDataPoint {
  name: string;
  scrutinized: number;
  flagged: number;
}

const activityStatusStyles = {
  success: { icon: "check_circle", bg: "color-mix(in srgb, var(--success) 10%, transparent)", fg: "var(--success)" },
  warning: { icon: "warning", bg: "color-mix(in srgb, var(--warning) 10%, transparent)", fg: "var(--warning)" },
  error: { icon: "error", bg: "color-mix(in srgb, var(--error) 10%, transparent)", fg: "var(--error)" },
  pending: { icon: "schedule", bg: "color-mix(in srgb, var(--muted-foreground) 10%, transparent)", fg: "var(--muted-foreground)" },
} as const;

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function TrendChip({ changeType, change }: { changeType: "positive" | "negative"; change: string }) {
  const isFlat = change.trim() === "0" || change.trim() === "0%";
  const isRising = change.trim().startsWith("+") || (!change.trim().startsWith("-") && !isFlat);
  const iconName = isFlat ? "trending_flat" : isRising ? "trending_up" : "trending_down";
  const color = isFlat ? "var(--muted-foreground)" : changeType === "positive" ? "var(--success)" : "var(--error)";
  const bg = isFlat ? "var(--muted)" : `color-mix(in srgb, ${color} 10%, transparent)`;

  return (
    <span
      className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[12px] font-medium"
      style={{ color, backgroundColor: bg }}
    >
      <MaterialIcon name={iconName} size={16} />
      {change}
    </span>
  );
}

function EmptyStateCard({ title, icon }: { title: string; icon: string }) {
  return (
    <Card className="border-border bg-card relative overflow-hidden py-3 md:py-6 gap-3 md:gap-6">
      <CardHeader className="flex flex-row items-center justify-between px-3 md:px-6 pb-1">
        <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground leading-tight">
          {title}
        </CardTitle>
        <div className="p-1.5 md:p-2 rounded-lg bg-muted flex-shrink-0">
          <MaterialIcon name={icon} size={16} className="text-muted-foreground" />
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
        <MaterialIcon name="dns" size={40} className="text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">
        Awaiting Backend Connection
      </h3>
      <p className="text-muted-foreground text-center max-w-md mb-6">
        Connect to your Django backend to view live scrutiny data, or enable Demo Mode to preview the interface with sample data.
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

    if (!backendConnected) {
      setStatsCards([]);
      setProcessingData([]);
      setRecentActivity([]);
      return;
    }

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

        const activityRes = await apiFetch("dashboard/recent-activity/");
        if (activityRes.ok) {
          const activityData = await activityRes.json();
          if (activityData.activities) {
            setRecentActivity(
              activityData.activities.map((a: ActivityItem) => ({
                ...a,
                timestamp: formatRelativeTime(a.timestamp),
              })),
            );
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
    const iconMap: Record<string, string> = {
      "Accounts Scrutinized": "fact_check",
      "Silent Arrears": "visibility_off",
      "Dormant Penalty": "toggle_off",
      "Miscalculated Arrears": "calculate",
    };
    return iconMap[title] || "description";
  };

  const showEmptyState = !demoMode && !backendConnected;

  return (
    <div className="space-y-6 pb-2 bg-background">
      {/* ===== Hero ===== */}
      <section
        className="relative overflow-hidden rounded-xl border border-border bg-card"
        style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
      >
        <div
          className="absolute inset-0 z-0 opacity-10"
          style={{ background: `linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)` }}
        />
        <div
          className="absolute inset-0 right-0 w-1/2 ml-auto z-0 opacity-20"
          style={{ backgroundImage: `radial-gradient(circle at 70% 30%, color-mix(in srgb, var(--primary) 20%, transparent), transparent 60%)` }}
        />

        <div className="relative z-20 p-8 md:p-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="max-w-xl">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[12px] uppercase font-bold tracking-wider mb-4 border border-border bg-muted text-primary"
            >
              <MaterialIcon name="shield" size={16} filled />
              BRNET Cross-Check Active
            </div>
            <h2 className="text-[40px] md:text-[48px] leading-tight font-bold mb-4 text-primary">
              Guardian Financial Tool —{" "}
              <span className="text-primary">Loan Reconciliation &amp; Arrears Verification.</span>
            </h2>
            <p className="text-base leading-6 mb-8 max-w-md text-muted-foreground">
              A manual reconciliation layer that checks Ordinary Loan (TL101) accounts against BRNET's interest and
              arrears calculations — catching Silent Arrears, Dormant Penalty, and Miscalculated Arrears before they
              reach the customer.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/uploads">
                <Button size="lg" variant="outline">
                  Upload BRNET Export
                </Button>
              </Link>
            </div>
          </div>

          <div
            className="backdrop-blur-md p-6 rounded-xl border border-border shadow-sm min-w-[280px]"
            style={{ backgroundColor: `color-mix(in srgb, var(--card) 90%, transparent)` }}
          >
            <h3 className="text-[16px] font-semibold mb-4 flex items-center gap-2 text-primary">
              <MaterialIcon name="monitor_heart" size={20} />
              June Scrutiny Snapshot
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-[12px] mb-1 text-muted-foreground">
                  <span>TL101 Coverage (target 100%)</span>
                  <span className="font-mono font-bold text-primary">
                    {statsCards[0]?.change ?? "—"}
                  </span>
                </div>
                <div className="w-full rounded-full h-1.5 bg-muted">
                  <div className="h-1.5 rounded-full" style={{ width: "10%", backgroundColor: "var(--primary)" }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[12px] mb-1 text-muted-foreground">
                  <span>Accounts flagged so far</span>
                  <span className="font-mono font-bold text-error">
                    {(Number(statsCards[1]?.value ?? 0) + Number(statsCards[2]?.value ?? 0) + Number(statsCards[3]?.value ?? 0)) || "—"}
                  </span>
                </div>
                <div className="w-full rounded-full h-1.5 bg-muted">
                  <div className="h-1.5 rounded-full" style={{ width: "9%", backgroundColor: "var(--error)" }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {showEmptyState ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:grid-cols-4">
            <EmptyStateCard title="Accounts Scrutinized" icon="fact_check" />
            <EmptyStateCard title="Silent Arrears" icon="visibility_off" />
            <EmptyStateCard title="Dormant Penalty" icon="toggle_off" />
            <EmptyStateCard title="Miscalculated Arrears" icon="calculate" />
          </div>

          <div className="grid gap-4 lg:grid-cols-7">
            <Card className="lg:col-span-4 border-border bg-card">
              <CardHeader>
                <CardTitle className="text-foreground">Weekly Scrutiny &amp; Flag Trend</CardTitle>
                <CardDescription>TL101 accounts checked vs. accounts flagged</CardDescription>
              </CardHeader>
              <CardContent>
                <AwaitingBackendState />
              </CardContent>
            </Card>

            <Card className="lg:col-span-3 border-border bg-card">
              <CardHeader>
                <CardTitle className="text-foreground">Recent Activity</CardTitle>
                <CardDescription>Latest reconciliation events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <MaterialIcon name="wifi_off" size={32} className="text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">No activity data available</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <>
          {/* ===== Stat cards ===== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:grid-cols-4">
            {statsCards.map((stat, i) => (
              <div
                key={stat.title}
                className="relative rounded-xl p-6 border border-border bg-card group transition-all hover:-translate-y-0.5"
                style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
              >
                {i === 0 && (
                  <div className="absolute -left-px top-4 bottom-4 w-1 rounded-r bg-primary" />
                )}
                {isLoading && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10 rounded-xl">
                    <MaterialIcon name="progress_activity" size={20} className="animate-spin text-primary" />
                  </div>
                )}
                <div className={`flex justify-between items-start mb-4 ${i === 0 ? "pl-2" : ""}`}>
                  <div>
                     <p className="text-[12px] uppercase tracking-wider text-muted-foreground">{stat.title}</p>
                    <h4 className="text-[32px] font-semibold mt-1 text-primary">{stat.value}</h4>
                  </div>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors"
                    style={{
                      backgroundColor: i === 0 ? "var(--muted)" : "color-mix(in srgb, var(--error) 5%, transparent)",
                      color: i === 0 ? "var(--primary)" : "var(--error)",
                    }}
                  >
                    <MaterialIcon name={stat.icon} size={22} />
                  </div>
                </div>
                <div className={`flex items-center gap-2 ${i === 0 ? "pl-2" : ""}`}>
                  <TrendChip changeType={stat.changeType} change={stat.change} />
                  <span className="text-xs text-muted-foreground">{stat.description}</span>
                </div>
              </div>
            ))}
          </div>

          {/* ===== Chart + Activity ===== */}
          <div className="grid gap-6 lg:grid-cols-7">
            <div
              className="lg:col-span-4 rounded-xl p-6 border border-border bg-card relative flex flex-col"
              style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
            >
              {isLoading && (
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10 rounded-xl">
                  <MaterialIcon name="progress_activity" size={24} className="animate-spin text-primary" />
                </div>
              )}
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-border">
                <h3 className="text-[20px] font-semibold text-primary">Weekly Scrutiny &amp; Flag Trend</h3>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm">7D</Button>
                  <Button variant="default" size="sm">30D</Button>
                  <Button variant="ghost" size="sm">YTD</Button>
                </div>
              </div>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={processingData}>
                    <defs>
                      <linearGradient id="scrutinizedGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="flaggedGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--error)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--error)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} vertical={false} />
                    <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} width={36} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        border: `1px solid var(--border)`,
                        borderRadius: "4px",
                        color: "var(--foreground)",
                        fontSize: "12px",
                      }}
                    />
                    <Area type="monotone" dataKey="scrutinized" stroke="var(--primary)" fill="url(#scrutinizedGradient)" strokeWidth={2} name="Accounts Scrutinized" />
                    <Area
                      type="monotone"
                      dataKey="flagged"
                      stroke="var(--error)"
                      strokeDasharray="4 2"
                      fill="url(#flaggedGradient)"
                      strokeWidth={2}
                      name="Accounts Flagged"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <span className="text-[12px] text-muted-foreground">Accounts Scrutinized</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full border-2 border-dashed border-error" />
                  <span className="text-[12px] text-muted-foreground">Accounts Flagged</span>
                </div>
              </div>
            </div>

            <div
              className="lg:col-span-3 rounded-xl p-6 border border-border bg-card relative h-[450px] flex flex-col"
              style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
            >
              {isLoading && (
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10 rounded-xl">
                  <MaterialIcon name="progress_activity" size={24} className="animate-spin text-primary" />
                </div>
              )}
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-border">
                <h3 className="text-[20px] font-semibold text-primary">Recent Activity</h3>
                <button className="text-primary" aria-label="More options">
                  <MaterialIcon name="more_horiz" size={20} />
                </button>
              </div>
              <div className="flex-grow overflow-y-auto pr-2 space-y-4">
                {recentActivity.map((activity, idx) => {
                  const cfg = activityStatusStyles[activity.status] ?? activityStatusStyles.success;
                  const isLast = idx === recentActivity.length - 1;
                  return (
                    <div key={activity.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10"
                          style={{ backgroundColor: cfg.bg, color: cfg.fg }}
                        >
                          <MaterialIcon name={cfg.icon} size={16} />
                        </div>
                        {!isLast && <div className="w-px h-full my-1 bg-border" />}
                      </div>
                      <div className="pb-2">
                        <p className="text-sm font-medium leading-tight text-primary">{activity.title}</p>
                        <p className="text-xs mt-1 text-muted-foreground">{activity.description}</p>
                        <p className="font-mono text-[10px] mt-2 text-muted-foreground">{activity.timestamp}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
                <Button variant="outline" className="w-full mt-4">
                  View All Activity
                </Button>
            </div>
          </div>
        </>
      )}

      {/* ===== Quick Tools ===== */}
      <div>
        <h3 className="text-[24px] font-semibold mb-1 text-primary">Quick Tools</h3>
        <p className="text-sm mb-6 text-muted-foreground">Navigate via the sidebar or click a tool below</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {quickActions.map((action) => (
            <Link key={action.title} href={action.href}>
              <div
                className="p-5 rounded-xl border border-border bg-card flex flex-col items-center text-center group transition-colors h-full"
                style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110"
                  style={{ backgroundColor: "color-mix(in srgb, var(--primary) 10%, transparent)", color: "var(--primary)" }}
                >
                  <MaterialIcon name={action.icon} size={24} />
                </div>
                <h4 className="text-[16px] font-semibold mb-1 text-primary">{action.title}</h4>
                <p className="text-[12px] leading-snug text-muted-foreground">{action.description}</p>
                <div
                  className="flex items-center gap-1 mt-3 text-[13px] font-medium opacity-0 group-hover:opacity-100 transition-opacity text-primary"
                >
                  Open <MaterialIcon name="arrow_forward" size={14} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
