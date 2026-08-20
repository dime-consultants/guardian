import {
  BadgeCheck,
  Bot,
  Calculator,
  EyeOff,
  Folder,
  Hammer,
  MessageCircle,
  ScrollText,
  SlidersHorizontal,
  ToggleLeft,
} from "lucide-react";

import type {
  ActivityItem,
  ExceptionAccount,
  MetricCardData,
  ProcessingDataPoint,
  QuickAction,
} from "./dashboard-types";

export const demoMetrics: MetricCardData[] = [
  {
    title: "Accounts Scrutinized",
    value: "412",
    change: "10%",
    changeType: "positive",
    icon: BadgeCheck,
    description: "of June TL101 target",
  },
  {
    title: "Silent Arrears",
    value: "18",
    change: "+6",
    changeType: "negative",
    icon: EyeOff,
    description: "Clean in BRNET, arrears detected",
  },
  {
    title: "Dormant Penalty",
    value: "11",
    change: "+3",
    changeType: "negative",
    icon: ToggleLeft,
    description: "Default rate not accruing",
  },
  {
    title: "Miscalculated Arrears",
    value: "9",
    change: "+2",
    changeType: "negative",
    icon: Calculator,
    description: "Expected arrears mismatch",
  },
];

export const demoProcessingData: ProcessingDataPoint[] = [
  { name: "Mon", scrutinized: 62, flagged: 5 },
  { name: "Tue", scrutinized: 58, flagged: 7 },
  { name: "Wed", scrutinized: 71, flagged: 4 },
  { name: "Thu", scrutinized: 65, flagged: 8 },
  { name: "Fri", scrutinized: 74, flagged: 6 },
  { name: "Sat", scrutinized: 22, flagged: 1 },
  { name: "Sun", scrutinized: 10, flagged: 0 },
];

export const demoActivity: ActivityItem[] = [
  {
    id: "act-1",
    title: "Silent Arrears flagged",
    description: "TL101 #48213 needs follow-up",
    timestamp: "12 minutes ago",
    status: "warning",
  },
  {
    id: "act-2",
    title: "Batch scrutiny complete",
    description: "62 accounts checked against BRNET",
    timestamp: "1 hour ago",
    status: "success",
  },
  {
    id: "act-3",
    title: "Miscalculated Arrears flagged",
    description: "TL101 #33876 differs from expected shortfall",
    timestamp: "2 hours ago",
    status: "error",
  },
  {
    id: "act-4",
    title: "BRNET export synced",
    description: "Nightly statement and loan schedule processed",
    timestamp: "Yesterday",
    status: "success",
  },
];

export const demoExceptions: ExceptionAccount[] = [
  {
    id: "tl101-48213",
    account: "TL101 #48213",
    borrower: "John Doe",
    issue: "Silent Arrears",
    outstanding: "KES 845,000",
    arrears: "KES 24,500",
    risk: "High",
  },
  {
    id: "tl101-51002",
    account: "TL101 #51002",
    borrower: "Mary Wanjiku",
    issue: "Dormant Penalty",
    outstanding: "KES 620,000",
    arrears: "KES 18,200",
    risk: "Medium",
  },
  {
    id: "tl101-33876",
    account: "TL101 #33876",
    borrower: "Peter Otieno",
    issue: "Miscalculated Arrears",
    outstanding: "KES 1,240,000",
    arrears: "KES 41,900",
    risk: "High",
  },
  {
    id: "tl101-44790",
    account: "TL101 #44790",
    borrower: "Grace Achieng",
    issue: "Silent Arrears",
    outstanding: "KES 395,000",
    arrears: "KES 8,700",
    risk: "Low",
  },
];

export const quickActions: QuickAction[] = [
  { title: "AI Engine", href: "/ai-engine", icon: Bot },
  { title: "Chat Assistant", href: "/chat", icon: MessageCircle },
  { title: "Data Tools", href: "/tools", icon: Hammer },
  { title: "File Manager", href: "/uploads", icon: Folder },
  { title: "Reports", href: "/reports", icon: ScrollText },
  { title: "Analytics", href: "/analytics", icon: SlidersHorizontal },
];
