import {
  BadgeCheck,
  Calculator,
  CheckCircle2,
  CircleAlert,
  Clock3,
  EyeOff,
  ScrollText,
  ToggleLeft,
} from "lucide-react";

import type {
  ActivityItem,
  DashboardIcon,
  IssueBreakdownItem,
  MetricCardData,
} from "./dashboard-types";

export const activityStatusStyles = {
  success: { icon: CheckCircle2, tone: "text-success bg-success/10" },
  warning: { icon: CircleAlert, tone: "text-warning bg-warning/10" },
  error: { icon: CircleAlert, tone: "text-error bg-error/10" },
  pending: { icon: Clock3, tone: "text-muted-foreground bg-muted" },
} satisfies Record<ActivityItem["status"], { icon: DashboardIcon; tone: string }>;

export function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (Number.isNaN(mins)) return iso;
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function iconForMetric(title: string): DashboardIcon {
  const iconMap: Record<string, DashboardIcon> = {
    "Accounts Scrutinized": BadgeCheck,
    "Silent Arrears": EyeOff,
    "Dormant Penalty": ToggleLeft,
    "Miscalculated Arrears": Calculator,
  };
  return iconMap[title] || ScrollText;
}

export function buildIssueBreakdown(metrics: MetricCardData[]): IssueBreakdownItem[] {
  return [
    {
      name: "Silent Arrears",
      value: Number(metrics.find((stat) => stat.title === "Silent Arrears")?.value ?? 0),
      color: "var(--chart-2)",
    },
    {
      name: "Dormant Penalty",
      value: Number(metrics.find((stat) => stat.title === "Dormant Penalty")?.value ?? 0),
      color: "var(--chart-3)",
    },
    {
      name: "Miscalculated",
      value: Number(metrics.find((stat) => stat.title === "Miscalculated Arrears")?.value ?? 0),
      color: "var(--chart-5)",
    },
  ];
}
