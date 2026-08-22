import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";

export type DashboardIcon = ComponentType<LucideProps>;

export interface MetricCardData {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative" | "neutral";
  icon: DashboardIcon;
  description: string;
}

export interface ActivityItem {
  id: string | number;
  title: string;
  description: string;
  timestamp: string;
  status: "success" | "warning" | "error" | "pending";
}

export interface ProcessingDataPoint {
  name: string;
  scrutinized: number;
  flagged: number;
}

export interface IssueBreakdownItem {
  name: string;
  value: number;
  color: string;
}

export interface ExceptionAccount {
  id: string;
  account: string;
  borrower: string;
  issue: string;
  outstanding: string;
  arrears: string;
  risk: "High" | "Medium" | "Low";
}

export interface QuickAction {
  title: string;
  href: string;
  icon: DashboardIcon;
}
