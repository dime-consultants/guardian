"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { ProcessingDataPoint } from "./dashboard-types";
import { DashboardSection } from "./dashboard-section";
import { cn } from "@/lib/utils";

type ScrutinyPeriod = "month" | "quarter" | "year";

const PERIOD_OPTIONS: { value: ScrutinyPeriod; label: string }[] = [
  { value: "month", label: "Monthly" },
  { value: "quarter", label: "Quarterly" },
  { value: "year", label: "Yearly" },
];

interface ScrutinyChartProps {
  data: ProcessingDataPoint[];
  period: ScrutinyPeriod;
  onPeriodChange: (period: ScrutinyPeriod) => void;
}

export function ScrutinyChart({ data, period, onPeriodChange }: ScrutinyChartProps) {
  return (
    <DashboardSection
      title="Scrutiny Revenue"
      className="lg:col-span-8"
      action={
        <div className="hidden rounded-md bg-muted p-0.5 text-xs text-muted-foreground sm:flex">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onPeriodChange(opt.value)}
              className={cn(
                "rounded px-2 py-1 transition-colors",
                period === opt.value
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      }
    >
      <div className="mb-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-primary" />
          Accounts Scrutinized
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-error" />
          Accounts Flagged
        </span>
      </div>
      <div className="h-[306px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={8}>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.7} />
            <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} stroke="var(--muted-foreground)" />
            <YAxis axisLine={false} tickLine={false} fontSize={12} stroke="var(--muted-foreground)" width={34} />
            <Tooltip
              cursor={{ fill: "color-mix(in srgb, var(--primary) 8%, transparent)" }}
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                color: "var(--foreground)",
                fontSize: "12px",
              }}
            />
            <Bar dataKey="scrutinized" fill="var(--chart-1)" radius={[5, 5, 0, 0]} name="Accounts Scrutinized" />
            <Bar dataKey="flagged" fill="var(--chart-5)" radius={[5, 5, 0, 0]} name="Accounts Flagged" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </DashboardSection>
  );
}
