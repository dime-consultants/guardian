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

/**
 * Guardian Bank — Material 3 role tokens, lifted 1:1 from the Stitch export
 * (tailwind.config `theme.extend.colors`). If reused elsewhere, promote
 * this block into the shared tailwind.config.js.
 */
const gb = {
  primary: "#0D3B8E",
  secondary: "#1F5FBF",
  accent: "#C8A248",
  white: "#FFFFFF",
  offWhite: "#F8F9FB",
  lightGray: "#EEF2F7",
  lightGrayLow: "#F1F5F9",
  lightGrayLowest: "#F8F9FB",
  primaryText: "#2B2B2B",
  secondaryText: "#6B7280",
  border: "#E5E7EB",
  success: "#10B981",
  error: "#ba1a1a",
  warning: "#F59E0B",
  primaryContainer: "#0D3B8E",
  primaryFixed: "#EEF2F7",
  secondaryContainer: "#EEF2F7",
  surfaceContainer: "#EEF2F7",
  surfaceContainerLow: "#EEF2F7",
  surfaceContainerLowest: "#FFFFFF",
  outlineVariant: "#E5E7EB",
  secondaryTextVariant: "#E5E7EB",
  whiteContainer: "#1F5FBF",
} as const;

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
    action: "Silent Arrears flagged — TL101 #48213",
    description: "Drawing power below outstanding; BRNET shows no arrears.",
    time: "12 minutes ago",
    status: "warning" as const,
  },
  {
    id: 2,
    action: "Batch scrutiny complete",
    description: "62 TL101 accounts checked against Guardian Financial Tool.",
    time: "1 hour ago",
    status: "success" as const,
  },
  {
    id: 3,
    action: "Miscalculated Arrears flagged — TL101 #33876",
    description: "BRNET arrears amount does not match expected installment shortfall.",
    time: "2 hours ago",
    status: "error" as const,
  },
  {
    id: 4,
    action: "Dormant Penalty flagged — TL101 #51002",
    description: "Account in arrears; default rate not accruing in BRNET.",
    time: "3 hours ago",
    status: "warning" as const,
  },
  {
    id: 5,
    action: "BRNET export synced",
    description: "Nightly account statement and loan schedule export processed.",
    time: "Yesterday, 11:59 PM",
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
  id: number;
  action: string;
  description: string;
  time: string;
  status: "success" | "warning" | "error";
}

interface ProcessingDataPoint {
  name: string;
  scrutinized: number;
  flagged: number;
}

const activityStatusStyles = {
  success: { icon: "check_circle", bg: `${gb.success}1A`, fg: gb.success },
  warning: { icon: "warning", bg: `${gb.warning}1A`, fg: gb.warning },
  error: { icon: "error", bg: `${gb.error}1A`, fg: gb.error },
} as const;

function TrendChip({ changeType, change }: { changeType: "positive" | "negative"; change: string }) {
  const isFlat = change.trim() === "0" || change.trim() === "0%";
  // The arrow always follows the literal direction of the number (a "+6" is trending up
  // whether it's good or bad); color is what signals good vs. bad for this tool, since a
  // rising Silent Arrears count is a rising number but a worsening outcome.
  const isRising = change.trim().startsWith("+") || (!change.trim().startsWith("-") && !isFlat);
  const iconName = isFlat ? "trending_flat" : isRising ? "trending_up" : "trending_down";
  const color = isFlat ? gb.secondaryText : changeType === "positive" ? gb.success : gb.error;
  const bg = isFlat ? gb.lightGray : `${color}1A`;

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
    <Card className="border-[#E5E7EB] bg-white relative overflow-hidden py-3 md:py-6 gap-3 md:gap-6">
      <CardHeader className="flex flex-row items-center justify-between px-3 md:px-6 pb-1">
        <CardTitle className="text-xs md:text-sm font-medium text-[#6B7280] leading-tight">
          {title}
        </CardTitle>
        <div className="p-1.5 md:p-2 rounded-lg bg-[#EEF2F7] flex-shrink-0">
          <MaterialIcon name={icon} size={16} className="text-[#6B7280]" />
        </div>
      </CardHeader>
      <CardContent className="px-3 md:px-6">
        <div className="text-xl md:text-2xl font-bold text-[#6B7280]">--</div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-[#6B7280]">No data</span>
        </div>
      </CardContent>
    </Card>
  );
}

function AwaitingBackendState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="p-4 rounded-full bg-[#EEF2F7] mb-4">
        <MaterialIcon name="dns" size={40} className="text-[#6B7280]" />
      </div>
      <h3 className="text-xl font-semibold text-[#2B2B2B] mb-2">
        Awaiting Backend Connection
      </h3>
      <p className="text-[#6B7280] text-center max-w-md mb-6">
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
    <div className="space-y-6 pb-2" style={{ backgroundColor: "#F8F9FB" }}>
      {/* ===== Hero ===== */}
      <section
        className="relative overflow-hidden rounded-xl border"
        style={{ borderColor: gb.border, backgroundColor: "#FFFFFF", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
      >
        <div
          className="absolute inset-0 z-0 opacity-10"
          style={{ background: `linear-gradient(135deg, ${gb.primary} 0%, ${gb.secondary} 100%)` }}
        />
        <div
          className="absolute inset-0 right-0 w-1/2 ml-auto z-0 opacity-20"
          style={{ backgroundImage: `radial-gradient(circle at 70% 30%, ${gb.primary}33, transparent 60%)` }}
        />

        <div className="relative z-20 p-8 md:p-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="max-w-xl">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[12px] uppercase font-bold tracking-wider mb-4 border"
              style={{ backgroundColor: gb.lightGray, color: gb.primary, borderColor: gb.border }}
            >
              <MaterialIcon name="shield" size={16} filled />
              BRNET Cross-Check Active
            </div>
            <h2 className="text-[40px] md:text-[48px] leading-tight font-bold mb-4" style={{ color: gb.primary }}>
              Guardian Financial Tool —{" "}
              <span style={{ color: gb.primaryContainer }}>Loan Reconciliation &amp; Arrears Verification.</span>
            </h2>
            <p className="text-base leading-6 mb-8 max-w-md" style={{ color: gb.secondary }}>
              A manual reconciliation layer that checks Ordinary Loan (TL101) accounts against BRNET's interest and
              arrears calculations — catching Silent Arrears, Dormant Penalty, and Miscalculated Arrears before they
              reach the customer.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/reconciliation-engine">
                <button
                  className="px-6 py-3 rounded-lg text-[16px] font-semibold shadow-sm hover:shadow-md transition-all"
                  style={{ backgroundColor: gb.primary, color: gb.white }}
                >
                  Run Reconciliation
                </button>
              </Link>
              <Link href="/uploads">
                <button
                  className="px-6 py-3 rounded-lg text-[16px] font-semibold border transition-all hover:opacity-80"
                  style={{ borderColor: gb.secondaryText, color: gb.primary, backgroundColor: "transparent" }}
                >
                  Upload BRNET Export
                </button>
              </Link>
            </div>
          </div>

          <div
            className="backdrop-blur-md p-6 rounded-xl border shadow-sm min-w-[280px]"
            style={{ backgroundColor: `${gb.lightGrayLowest}E6`, borderColor: gb.secondaryTextVariant }}
          >
            <h3 className="text-[16px] font-semibold mb-4 flex items-center gap-2" style={{ color: gb.primary }}>
              <MaterialIcon name="monitor_heart" size={20} />
              June Scrutiny Snapshot
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-[12px] mb-1" style={{ color: gb.secondary }}>
                  <span>TL101 Coverage (target 100%)</span>
                  <span className="font-mono font-bold" style={{ color: gb.primary }}>
                    {statsCards[0]?.change ?? "—"}
                  </span>
                </div>
                <div className="w-full rounded-full h-1.5" style={{ backgroundColor: gb.lightGray }}>
                  <div className="h-1.5 rounded-full" style={{ width: "10%", backgroundColor: gb.primary }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[12px] mb-1" style={{ color: gb.secondary }}>
                  <span>Accounts flagged so far</span>
                  <span className="font-mono font-bold" style={{ color: gb.error }}>
                    {(Number(statsCards[1]?.value ?? 0) + Number(statsCards[2]?.value ?? 0) + Number(statsCards[3]?.value ?? 0)) || "—"}
                  </span>
                </div>
                <div className="w-full rounded-full h-1.5" style={{ backgroundColor: gb.lightGray }}>
                  <div className="h-1.5 rounded-full" style={{ width: "9%", backgroundColor: gb.error }} />
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
            <Card className="lg:col-span-4 border-[#E5E7EB] bg-white">
              <CardHeader>
                <CardTitle className="text-[#2B2B2B]">Weekly Scrutiny &amp; Flag Trend</CardTitle>
                <CardDescription>TL101 accounts checked vs. accounts flagged</CardDescription>
              </CardHeader>
              <CardContent>
                <AwaitingBackendState />
              </CardContent>
            </Card>

            <Card className="lg:col-span-3 border-[#E5E7EB] bg-white">
              <CardHeader>
                <CardTitle className="text-[#2B2B2B]">Recent Activity</CardTitle>
                <CardDescription>Latest reconciliation events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <MaterialIcon name="wifi_off" size={32} className="text-[#6B7280] mb-3" />
                  <p className="text-sm text-[#6B7280]">No activity data available</p>
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
                className="relative rounded-xl p-6 border group transition-all hover:-translate-y-0.5"
                style={{ backgroundColor: gb.lightGrayLowest, borderColor: gb.secondaryTextVariant, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
              >
                {i === 0 && (
                  <div className="absolute -left-px top-4 bottom-4 w-1 rounded-r" style={{ backgroundColor: gb.primaryContainer }} />
                )}
                {isLoading && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 rounded-xl">
                    <MaterialIcon name="progress_activity" size={20} className="animate-spin" style={{ color: gb.primary }} />
                  </div>
                )}
                <div className={`flex justify-between items-start mb-4 ${i === 0 ? "pl-2" : ""}`}>
                  <div>
                    <p className="text-[12px] uppercase tracking-wider" style={{ color: gb.secondary }}>{stat.title}</p>
                    <h4 className="text-[32px] font-semibold mt-1" style={{ color: gb.primary }}>{stat.value}</h4>
                  </div>
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors"
                    style={{
                      backgroundColor: i === 0 ? gb.lightGrayLow : `${gb.error}0D`,
                      color: i === 0 ? gb.primary : gb.error,
                    }}
                  >
                    <MaterialIcon name={stat.icon} size={22} />
                  </div>
                </div>
                <div className={`flex items-center gap-2 ${i === 0 ? "pl-2" : ""}`}>
                  <TrendChip changeType={stat.changeType} change={stat.change} />
                  <span className="text-xs" style={{ color: gb.secondary }}>{stat.description}</span>
                </div>
              </div>
            ))}
          </div>

          {/* ===== Chart + Activity ===== */}
          <div className="grid gap-6 lg:grid-cols-7">
            <div
              className="lg:col-span-4 rounded-xl p-6 border relative flex flex-col"
              style={{ backgroundColor: gb.lightGrayLowest, borderColor: gb.secondaryTextVariant, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
            >
              {isLoading && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 rounded-xl">
                  <MaterialIcon name="progress_activity" size={24} className="animate-spin" style={{ color: gb.primary }} />
                </div>
              )}
              <div className="flex justify-between items-center mb-6 pb-4 border-b" style={{ borderColor: gb.secondaryTextVariant }}>
                <h3 className="text-[20px] font-semibold" style={{ color: gb.primary }}>Weekly Scrutiny &amp; Flag Trend</h3>
                <div className="flex gap-2">
                  <button className="px-3 py-1 rounded text-[12px]" style={{ backgroundColor: gb.lightGrayLow, color: gb.secondary }}>7D</button>
                  <button className="px-3 py-1 rounded text-[12px] shadow-sm" style={{ backgroundColor: gb.primary, color: gb.white }}>30D</button>
                  <button className="px-3 py-1 rounded text-[12px]" style={{ backgroundColor: gb.lightGrayLow, color: gb.secondary }}>YTD</button>
                </div>
              </div>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={processingData}>
                    <defs>
                      <linearGradient id="scrutinizedGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={gb.primary} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={gb.primary} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="flaggedGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={gb.error} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={gb.error} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gb.secondaryTextVariant} strokeOpacity={0.5} vertical={false} />
                    <XAxis dataKey="name" stroke={gb.secondary} fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke={gb.secondary} fontSize={12} tickLine={false} axisLine={false} width={36} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: gb.lightGrayLowest,
                        border: `1px solid ${gb.secondaryTextVariant}`,
                        borderRadius: "4px",
                        color: gb.primaryText,
                        fontSize: "12px",
                      }}
                    />
                    <Area type="monotone" dataKey="scrutinized" stroke={gb.primary} fill="url(#scrutinizedGradient)" strokeWidth={2} name="Accounts Scrutinized" />
                    <Area
                      type="monotone"
                      dataKey="flagged"
                      stroke={gb.error}
                      strokeDasharray="4 2"
                      fill="url(#flaggedGradient)"
                      strokeWidth={2}
                      name="Accounts Flagged"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t" style={{ borderColor: gb.secondaryTextVariant }}>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: gb.primary }} />
                  <span className="text-[12px]" style={{ color: gb.secondary }}>Accounts Scrutinized</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full border-2 border-dashed" style={{ borderColor: gb.error }} />
                  <span className="text-[12px]" style={{ color: gb.secondary }}>Accounts Flagged</span>
                </div>
              </div>
            </div>

            <div
              className="lg:col-span-3 rounded-xl p-6 border relative h-[450px] flex flex-col"
              style={{ backgroundColor: gb.lightGrayLowest, borderColor: gb.secondaryTextVariant, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
            >
              {isLoading && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 rounded-xl">
                  <MaterialIcon name="progress_activity" size={24} className="animate-spin" style={{ color: gb.primary }} />
                </div>
              )}
              <div className="flex justify-between items-center mb-4 pb-4 border-b" style={{ borderColor: gb.secondaryTextVariant }}>
                <h3 className="text-[20px] font-semibold" style={{ color: gb.primary }}>Recent Activity</h3>
                <button style={{ color: gb.primary }} aria-label="More options">
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
                        {!isLast && <div className="w-px h-full my-1" style={{ backgroundColor: gb.secondaryTextVariant }} />}
                      </div>
                      <div className="pb-2">
                        <p className="text-sm font-medium leading-tight" style={{ color: gb.primary }}>{activity.action}</p>
                        <p className="text-xs mt-1" style={{ color: gb.secondary }}>{activity.description}</p>
                        <p className="font-mono text-[10px] mt-2" style={{ color: gb.secondaryText }}>{activity.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <button
                className="w-full mt-4 py-2 border rounded-lg text-[12px] font-medium transition-colors hover:opacity-80"
                style={{ borderColor: gb.secondaryTextVariant, color: gb.primary }}
              >
                View All Activity
              </button>
            </div>
          </div>
        </>
      )}

      {/* ===== Quick Tools ===== */}
      <div>
        <h3 className="text-[24px] font-semibold mb-1" style={{ color: gb.primary }}>Quick Tools</h3>
        <p className="text-sm mb-6" style={{ color: gb.secondaryText }}>Navigate via the sidebar or click a tool below</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {quickActions.map((action) => (
            <Link key={action.title} href={action.href}>
              <div
                className="p-5 rounded-xl border flex flex-col items-center text-center group transition-colors h-full"
                style={{ backgroundColor: gb.lightGrayLowest, borderColor: gb.secondaryTextVariant, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${gb.primary}1A`, color: gb.primary }}
                >
                  <MaterialIcon name={action.icon} size={24} />
                </div>
                <h4 className="text-[16px] font-semibold mb-1" style={{ color: gb.primary }}>{action.title}</h4>
                <p className="text-[12px] leading-snug" style={{ color: gb.secondaryText }}>{action.description}</p>
                <div
                  className="flex items-center gap-1 mt-3 text-[13px] font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: gb.primary }}
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

// "use client";

// import { useState, useEffect } from "react";
// import {
//   Brain,
//   MessageSquare,
//   Wrench,
//   Upload,
//   FileSpreadsheet,
//   BarChart3,
//   ArrowRight,
//   Clock,
//   CheckCircle2,
//   AlertCircle,
//   FileText,
//   Zap,
//   Loader2,
//   WifiOff,
//   Server,
// } from "lucide-react";
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import Link from "next/link";
// import {
//   AreaChart,
//   Area,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   ResponsiveContainer,
// } from "recharts";
// import { useApp } from "@/contexts/app-context";

// // Demo data
// const demoStatsCards = [
//   {
//     title: "Invoices Processed",
//     value: "2,847",
//     change: "+12.5%",
//     changeType: "positive" as const,
//     icon: FileText,
//     description: "This month",
//   },
//   {
//     title: "Time Saved",
//     value: "142 hrs",
//     change: "+23.1%",
//     changeType: "positive" as const,
//     icon: Clock,
//     description: "Automation efficiency",
//   },
//   {
//     title: "Reconciliations",
//     value: "98.7%",
//     change: "+2.3%",
//     changeType: "positive" as const,
//     icon: CheckCircle2,
//     description: "Accuracy rate",
//   },
//   {
//     title: "Pending Reviews",
//     value: "23",
//     change: "-8",
//     changeType: "negative" as const,
//     icon: AlertCircle,
//     description: "Requires attention",
//   },
// ];

// const quickActions = [
//   {
//     title: "AI Engine",
//     description: "AI-powered data analysis, variance detection, and automated insights generation for invoice reconciliation.",
//     href: "/ai-engine",
//     icon: Brain,
//     color: "bg-chart-1/10 text-chart-1",
//   },
//   {
//     title: "Chat Assistant",
//     description: "Interactive AI assistant for real-time queries, report requests, and workflow automation guidance.",
//     href: "/chat",
//     icon: MessageSquare,
//     color: "bg-chart-2/10 text-chart-2",
//   },
//   {
//     title: "Data Tools",
//     description: "Convert TXT to XLSX, clean data formats, and perform automated data transformations.",
//     href: "/tools",
//     icon: Wrench,
//     color: "bg-chart-3/10 text-chart-3",
//   },
//   {
//     title: "File Manager",
//     description: "Upload invoice files, manage document storage, and organize billing data from vendors.",
//     href: "/uploads",
//     icon: Upload,
//     color: "bg-chart-4/10 text-chart-4",
//   },
//   {
//     title: "Reports",
//     description: "Access generated reports, daily/weekly/monthly summaries, and reconciliation outputs.",
//     href: "/reports",
//     icon: FileSpreadsheet,
//     color: "bg-chart-5/10 text-chart-5",
//   },
//   {
//     title: "Analytics",
//     description: "Performance dashboards, processing metrics, and automation efficiency tracking.",
//     href: "/analytics",
//     icon: BarChart3,
//     color: "bg-chart-1/10 text-chart-1",
//   },
// ];

// const demoProcessingData = [
//   { name: "Mon", invoices: 420, reconciled: 415 },
//   { name: "Tue", invoices: 380, reconciled: 375 },
//   { name: "Wed", invoices: 510, reconciled: 502 },
//   { name: "Thu", invoices: 470, reconciled: 468 },
//   { name: "Fri", invoices: 520, reconciled: 515 },
//   { name: "Sat", invoices: 180, reconciled: 180 },
//   { name: "Sun", invoices: 90, reconciled: 90 },
// ];

// const demoRecentActivity = [
//   {
//     id: 1,
//     action: "Invoice batch processed",
//     description: "247 invoices from ACON system",
//     time: "2 minutes ago",
//     status: "success" as const,
//   },
//   {
//     id: 2,
//     action: "Telephone billing report",
//     description: "May 2024 - 577 pages processed",
//     time: "15 minutes ago",
//     status: "success" as const,
//   },
//   {
//     id: 3,
//     action: "Variance detected",
//     description: "12 invoices flagged for review",
//     time: "1 hour ago",
//     status: "warning" as const,
//   },
//   {
//     id: 4,
//     action: "KRA reconciliation complete",
//     description: "Daily tax compliance verified",
//     time: "2 hours ago",
//     status: "success" as const,
//   },
//   {
//     id: 5,
//     action: "Data conversion",
//     description: "TXT to XLSX - 1,200 records",
//     time: "3 hours ago",
//     status: "success" as const,
//   },
// ];

// interface StatsCard {
//   title: string;
//   value: string;
//   change: string;
//   changeType: "positive" | "negative";
//   icon: typeof FileText;
//   description: string;
// }

// interface ActivityItem {
//   id: number;
//   action: string;
//   description: string;
//   time: string;
//   status: "success" | "warning" | "error";
// }

// interface ProcessingDataPoint {
//   name: string;
//   invoices: number;
//   reconciled: number;
// }

// function EmptyStateCard({ title, icon: Icon }: { title: string; icon: typeof FileText }) {
//   return (
//     <Card className="border-border bg-card relative overflow-hidden py-3 md:py-6 gap-3 md:gap-6">
//       <CardHeader className="flex flex-row items-center justify-between px-3 md:px-6 pb-1">
//         <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground leading-tight">
//           {title}
//         </CardTitle>
//         <div className="p-1.5 md:p-2 rounded-lg bg-muted flex-shrink-0">
//           <Icon className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
//         </div>
//       </CardHeader>
//       <CardContent className="px-3 md:px-6">
//         <div className="text-xl md:text-2xl font-bold text-muted-foreground">--</div>
//         <div className="flex items-center gap-2 mt-1">
//           <span className="text-xs text-muted-foreground">No data</span>
//         </div>
//       </CardContent>
//     </Card>
//   );
// }

// function AwaitingBackendState() {
//   return (
//     <div className="flex flex-col items-center justify-center py-16 px-4">
//       <div className="p-4 rounded-full bg-muted mb-4">
//         <Server className="h-10 w-10 text-muted-foreground" />
//       </div>
//       <h3 className="text-xl font-semibold text-foreground mb-2">
//         Awaiting Backend Connection
//       </h3>
//       <p className="text-muted-foreground text-center max-w-md mb-6">
//         Connect to your Django backend to view live data, or enable Demo Mode to preview the interface with sample data.
//       </p>
//       <div className="flex items-center gap-3">
//         <Link href="/settings">
//           <Button variant="outline">
//             Configure Backend
//           </Button>
//         </Link>
//       </div>
//     </div>
//   );
// }
// export function DashboardHome() {
//   const { demoMode, backendConnected, backendUrl, apiFetch } = useApp();
//   const [statsCards, setStatsCards] = useState<StatsCard[]>([]);
//   const [processingData, setProcessingData] = useState<ProcessingDataPoint[]>([]);
//   const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
//   const [isLoading, setIsLoading] = useState(false);

//   useEffect(() => {
//     if (demoMode) {
//       setStatsCards(demoStatsCards);
//       setProcessingData(demoProcessingData);
//       setRecentActivity(demoRecentActivity);
//       return;
//     }

//     // When not in demo mode and not connected, show empty state
//     if (!backendConnected) {
//       setStatsCards([]);
//       setProcessingData([]);
//       setRecentActivity([]);
//       return;
//     }

//     // Fetch from backend when connected
//     const fetchDashboardData = async () => {
//       setIsLoading(true);
//       try {
//         const statsRes = await apiFetch("dashboard/stats/");
//         if (statsRes.ok) {
//           const statsData = await statsRes.json();
//           if (statsData.stats) {
//             setStatsCards(statsData.stats.map((s: Record<string, unknown>) => ({
//               ...s,
//               icon: getIconForStat(s.title as string),
//             })));
//           }
//         }

//         const processingRes = await apiFetch("dashboard/processing/");
//         if (processingRes.ok) {
//           const processingDataResult = await processingRes.json();
//           if (processingDataResult.data) {
//             setProcessingData(processingDataResult.data);
//           }
//         }

//         const activityRes = await apiFetch("dashboard/activity/");
//         if (activityRes.ok) {
//           const activityData = await activityRes.json();
//           if (activityData.activities) {
//             setRecentActivity(activityData.activities);
//           }
//         }
//       } catch (err) {
//         console.error("Failed to fetch dashboard data:", err);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     fetchDashboardData();
//     const interval = setInterval(fetchDashboardData, 60000);
//     return () => clearInterval(interval);
//   }, [demoMode, backendConnected, backendUrl]);

//   const getIconForStat = (title: string) => {
//     const iconMap: Record<string, typeof FileText> = {
//       "Invoices Processed": FileText,
//       "Time Saved": Clock,
//       "Reconciliations": CheckCircle2,
//       "Pending Reviews": AlertCircle,
//     };
//     return iconMap[title] || FileText;
//   };

//   const showEmptyState = !demoMode && !backendConnected;

//   return (
//     <div className="space-y-6 pb-2">
//       <section className="relative overflow-hidden rounded-[32px] border border-[rgb(2,3,129)]/15 bg-[linear-gradient(135deg,#f8fbff_0%,#ffffff_50%,#eef4ff_100%)] p-5 md:p-8">
//         <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(2,3,129,0.14),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(2,3,129,0.18),transparent_34%)]" />
//         <div className="absolute right-6 top-6 h-24 w-24 rounded-full bg-[rgb(2,3,129)]/15 blur-2xl" />
//         <div className="absolute left-8 bottom-4 h-28 w-28 rounded-full bg-[rgb(2,3,129)]/12 blur-3xl" />

//         <div className="relative z-10 grid gap-6 lg:grid-cols-[1.25fr_0.9fr] lg:items-center">
//           <div className="space-y-5">
//             <div className="inline-flex items-center gap-2 rounded-full border border-[rgb(2,3,129)]/15 bg-white/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-[rgb(2,3,129)] shadow-sm">
//               Guardian Bank Digital Platform
//             </div>

//             <div className="space-y-3">
//               <h1 className="max-w-2xl text-4xl font-black tracking-[-0.05em] text-[rgb(2,3,129)] sm:text-5xl md:text-6xl">
//                 Banking at the speed of intelligence.
//               </h1>
//               <p className="max-w-xl text-base text-[rgb(2,3,129)]/80 md:text-lg">
//                 A secure, premium banking workspace for customer operations, account oversight, and AI-powered financial workflows.
//               </p>
//             </div>

//             <div className="flex flex-wrap items-center gap-3">
//               <Button className="bg-[rgb(2,3,129)] text-white hover:bg-[#1f2c9d] rounded-full px-6 py-5 shadow-lg shadow-[rgb(2,3,129)]/15">
//                 Explore Services
//               </Button>
//               <Button variant="outline" className="rounded-full border-[rgb(2,3,129)]/25 bg-white text-[rgb(2,3,129)] hover:bg-[rgb(2,3,129)]/5 px-6 py-5">
//                 Book a Demo
//               </Button>
//             </div>

//             <div className="grid gap-3 sm:grid-cols-3">
//               <div className="rounded-2xl border border-[rgb(2,3,129)]/15 bg-white/85 p-3">
//                 <div className="text-lg font-bold text-[rgb(2,3,129)]">24/7</div>
//                 <div className="text-xs text-[rgb(2,3,129)]/75">Secure monitoring</div>
//               </div>
//               <div className="rounded-2xl border border-[rgb(2,3,129)]/15 bg-white/85 p-3">
//                 <div className="text-lg font-bold text-[rgb(2,3,129)]">98.7%</div>
//                 <div className="text-xs text-[rgb(2,3,129)]/75">Workflow accuracy</div>
//               </div>
//               <div className="rounded-2xl border border-[rgb(2,3,129)]/15 bg-white/85 p-3">
//                 <div className="text-lg font-bold text-[rgb(2,3,129)]">142 hrs</div>
//                 <div className="text-xs text-[rgb(2,3,129)]/75">Time saved monthly</div>
//               </div>
//             </div>
//           </div>

//           <div className="rounded-[32px] border border-[rgb(2,3,129)]/20 bg-white/90 p-4 shadow-[0_20px_70px_rgba(2,3,129,0.14)] backdrop-blur-md">
//             <div className="rounded-[28px] bg-[linear-gradient(145deg,rgb(2,3,129)_0%,rgb(34,41,179)_100%)] p-4 text-white">
//               <div className="flex items-center justify-between">
//                 <div className="text-[10px] font-semibold uppercase tracking-[0.32em] text-white/80">
//                   Operations Snapshot
//                 </div>
//                 <div className="rounded-full border border-white/30 bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em]">
//                   Live
//                 </div>
//               </div>

//               <div className="mt-5 rounded-[24px] bg-[#F5FAFE] p-4 text-[rgb(2,3,129)] shadow-inner shadow-[rgb(2,3,129)]/10">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[rgb(2,3,129)]/75">
//                       Processing speed
//                     </div>
//                     <div className="mt-2 text-3xl font-black tracking-[-0.05em]">1.8x faster</div>
//                   </div>
//                   <div className="rounded-full bg-[rgb(2,3,129)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-white">
//                     Smart lane
//                   </div>
//                 </div>
//               </div>

//               <div className="mt-4 grid gap-3 sm:grid-cols-2">
//                 <div className="rounded-[20px] border border-white/20 bg-white/10 p-3">
//                   <div className="text-[10px] uppercase tracking-[0.24em] text-white/70">Requests</div>
//                   <div className="mt-2 text-2xl font-bold">2,847</div>
//                 </div>
//                 <div className="rounded-[20px] border border-white/20 bg-white/10 p-3">
//                   <div className="text-[10px] uppercase tracking-[0.24em] text-white/70">Alerts</div>
//                   <div className="mt-2 text-2xl font-bold">23</div>
//                 </div>
//               </div>

//               <div className="mt-4 rounded-[20px] bg-white/10 p-3 backdrop-blur-sm">
//                 <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.24em] text-white/75">
//                   <span>Monthly throughput</span>
//                   <span>+12.5%</span>
//                 </div>
//                 <div className="mt-3 h-2 rounded-full bg-white/20">
//                   <div className="h-2 w-[78%] rounded-full bg-[#F5FAFE]" />
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>

//       {showEmptyState ? (
//         <>
//           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:grid-cols-4">
//             <EmptyStateCard title="Invoices Processed" icon={FileText} />
//             <EmptyStateCard title="Time Saved" icon={Clock} />
//             <EmptyStateCard title="Reconciliations" icon={CheckCircle2} />
//             <EmptyStateCard title="Pending Reviews" icon={AlertCircle} />
//           </div>

//           <div className="grid gap-4 lg:grid-cols-7">
//             <Card className="lg:col-span-4 border-border bg-card">
//               <CardHeader>
//                 <CardTitle className="text-card-foreground">Weekly Processing Overview</CardTitle>
//                 <CardDescription>Invoice processing and reconciliation trends</CardDescription>
//               </CardHeader>
//               <CardContent>
//                 <AwaitingBackendState />
//               </CardContent>
//             </Card>

//             <Card className="lg:col-span-3 border-border bg-card">
//               <CardHeader>
//                 <CardTitle className="text-card-foreground">Recent Activity</CardTitle>
//                 <CardDescription>Latest automation events</CardDescription>
//               </CardHeader>
//               <CardContent>
//                 <div className="flex flex-col items-center justify-center py-12 text-center">
//                   <WifiOff className="h-8 w-8 text-muted-foreground mb-3" />
//                   <p className="text-sm text-muted-foreground">No activity data available</p>
//                 </div>
//               </CardContent>
//             </Card>
//           </div>
//         </>
//       ) : (
//         <>
//           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:grid-cols-4">
//             {statsCards.map((stat) => {
//               const IconComponent = stat.icon;
//               return (
//                 <Card key={stat.title} className="border-blue-100 bg-white relative overflow-hidden py-4 md:py-6 gap-3 md:gap-6 shadow-[0_10px_30px_rgba(37,99,235,0.07)]">
//                   {isLoading && (
//                     <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
//                       <Loader2 className="h-5 w-5 animate-spin text-blue-700" />
//                     </div>
//                   )}
//                   <CardHeader className="flex flex-row items-center justify-between px-4 md:px-6 pb-1">
//                     <CardTitle className="text-sm font-medium text-blue-800 leading-tight">
//                       {stat.title}
//                     </CardTitle>
//                     <div className="p-2 rounded-lg flex-shrink-0 bg-[rgb(2,3,129)]/5">
//                       <IconComponent className="h-4 w-4 text-[rgb(2,3,129)]" />
//                     </div>
//                   </CardHeader>
//                   <CardContent className="px-4 md:px-6">
//                     <div className="text-2xl md:text-3xl font-bold text-[rgb(2,3,129)]">{stat.value}</div>
//                     <div className="flex items-center gap-2 mt-1">
//                       <span className="text-xs font-medium text-[rgb(2,3,129)]">{stat.change}</span>
//                       <span className="text-xs text-[rgb(2,3,129)]/70">{stat.description}</span>
//                     </div>
//                   </CardContent>
//                 </Card>
//               );
//             })}
//           </div>

//           <div className="grid gap-4 lg:grid-cols-7">
//             <Card className="lg:col-span-4 border-[rgb(2,3,129)]/10 bg-white relative overflow-hidden shadow-[0_10px_30px_rgba(2,3,129,0.07)]">
//               {isLoading && (
//                 <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
//                   <Loader2 className="h-6 w-6 animate-spin text-blue-700" />
//                 </div>
//               )}
//               <CardHeader>
//                 <CardTitle className="text-[rgb(2,3,129)]">Weekly Processing Overview</CardTitle>
//                 <CardDescription className="text-[rgb(2,3,129)]/70">Invoice processing and reconciliation trends</CardDescription>
//               </CardHeader>
//               <CardContent>
//                 <div className="h-[300px]">
//                   <ResponsiveContainer width="100%" height="100%">
//                     <AreaChart data={processingData}>
//                       <defs>
//                         <linearGradient id="invoicesGradient" x1="0" y1="0" x2="0" y2="1">
//                           <stop offset="5%" stopColor="rgb(2, 3, 129)" stopOpacity={0.3} />
//                           <stop offset="95%" stopColor="rgb(2, 3, 129)" stopOpacity={0} />
//                         </linearGradient>
//                       </defs>
//                       <CartesianGrid strokeDasharray="3 3" className="stroke-[rgb(2,3,129)]/10" />
//                       <XAxis dataKey="name" className="text-[rgb(2,3,129)]" fontSize={12} />
//                       <YAxis className="text-[rgb(2,3,129)]" fontSize={12} />
//                       <Tooltip
//                         contentStyle={{
//                           backgroundColor: "#ffffff",
//                           border: "1px solid #bfdbfe",
//                           borderRadius: "8px",
//                           color: "#0f172a",
//                         }}
//                       />
//                       <Area
//                         type="monotone"
//                         dataKey="invoices"
//                         stroke="rgb(2, 3, 129)"
//                         fill="url(#invoicesGradient)"
//                         strokeWidth={2}
//                         name="Invoices"
//                       />
//                       <Area
//                         type="monotone"
//                         dataKey="reconciled"
//                         stroke="rgb(34, 41, 179)"
//                         fill="#e7ecff"
//                         strokeWidth={2}
//                         name="Reconciled"
//                       />
//                     </AreaChart>
//                   </ResponsiveContainer>
//                 </div>
//               </CardContent>
//             </Card>

//             <Card className="lg:col-span-3 border-[rgb(2,3,129)]/10 bg-white relative overflow-hidden shadow-[0_10px_30px_rgba(2,3,129,0.07)]">
//               {isLoading && (
//                 <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
//                   <Loader2 className="h-6 w-6 animate-spin text-blue-700" />
//                 </div>
//               )}
//               <CardHeader>
//                 <CardTitle className="text-[rgb(2,3,129)]">Recent Activity</CardTitle>
//                 <CardDescription className="text-[rgb(2,3,129)]/70">Latest automation events</CardDescription>
//               </CardHeader>
//               <CardContent>
//                 <div className="space-y-4">
//                   {recentActivity.map((activity) => (
//                     <div key={activity.id} className="flex items-start gap-3 rounded-2xl border border-[rgb(2,3,129)]/10 bg-[rgb(2,3,129)]/5 p-2.5">
//                       <div className="mt-1 h-2 w-2 rounded-full flex-shrink-0 bg-[rgb(2,3,129)]" />
//                       <div className="flex-1 min-w-0">
//                         <p className="text-sm font-medium text-[rgb(2,3,129)]">{activity.action}</p>
//                         <p className="text-xs text-[rgb(2,3,129)]/75 truncate">{activity.description}</p>
//                       </div>
//                       <span className="text-xs text-[rgb(2,3,129)] whitespace-nowrap">{activity.time}</span>
//                     </div>
//                   ))}
//                 </div>
//               </CardContent>
//             </Card>
//           </div>
//         </>
//       )}

//       <div>
//         <div className="mb-3 md:mb-4 flex items-center justify-between gap-4">
//           <h3 className="text-base md:text-lg font-semibold text-[rgb(2,3,129)]">Quick Actions</h3>
//           <div className="hidden md:flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-[rgb(2,3,129)]">
//             <span className="h-2 w-2 rounded-full bg-[rgb(2,3,129)]" />
//             Studio Access
//           </div>
//         </div>
//         <div className="flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory md:grid md:gap-4 md:grid-cols-2 md:overflow-visible lg:grid-cols-3">
//           {quickActions.map((action) => (
//             <Link key={action.title} href={action.href} className="flex-shrink-0 w-[42vw] min-w-[148px] max-w-[176px] snap-start md:w-auto md:max-w-none">
//               <Card className="h-full border border-[rgb(2,3,129)]/15 bg-[#F5FAFE] hover:border-[rgb(2,3,129)]/30 hover:shadow-[0_18px_40px_rgba(2,3,129,0.14)] transition-all cursor-pointer group rounded-[24px]">
//                 <CardHeader className="pb-3">
//                   <div className="flex items-center gap-3">
//                     <div className="p-2.5 rounded-xl bg-[rgb(2,3,129)] text-white shadow-sm">
//                       <action.icon className="h-5 w-5" />
//                     </div>
//                     <CardTitle className="text-sm text-[rgb(2,3,129)] group-hover:text-[rgb(34,41,179)] transition-colors leading-snug">
//                       {action.title}
//                     </CardTitle>
//                   </div>
//                 </CardHeader>
//                 <CardContent className="pt-0">
//                   <p className="text-xs md:text-sm text-[rgb(2,3,129)]/75 leading-relaxed line-clamp-3">
//                     {action.description}
//                   </p>
//                   <div className="flex items-center gap-1 mt-3 text-[rgb(2,3,129)] text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
//                     Open <ArrowRight className="h-4 w-4" />
//                   </div>
//                 </CardContent>
//               </Card>
//             </Link>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }
