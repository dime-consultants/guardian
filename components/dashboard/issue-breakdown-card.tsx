"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import type { IssueBreakdownItem } from "./dashboard-types";
import { DashboardSection } from "./dashboard-section";

interface IssueBreakdownCardProps {
  data: IssueBreakdownItem[];
}

export function IssueBreakdownCard({ data }: IssueBreakdownCardProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <DashboardSection title="Top Exceptions" className="lg:col-span-4">
      <div className="relative h-[190px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={54} outerRadius={78} paddingAngle={3}>
              {data.map((item) => (
                <Cell key={item.name} fill={item.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                color: "var(--foreground)",
                fontSize: "12px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-muted-foreground">Total</span>
          <span className="text-xl font-semibold text-foreground">{total}</span>
        </div>
      </div>

      <div className="space-y-2">
        {data.map((item) => {
          const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
          return (
            <div key={item.name} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 text-xs">
              <div className="flex min-w-0 items-center gap-2">
                <span className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="truncate text-foreground">{item.name}</span>
              </div>
              <span className="text-muted-foreground">{item.value}</span>
              <span className="w-8 text-right font-medium text-foreground">{pct}%</span>
            </div>
          );
        })}
      </div>
    </DashboardSection>
  );
}
