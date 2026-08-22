import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface DashboardSectionProps {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function DashboardSection({ title, action, children, className }: DashboardSectionProps) {
  return (
    <section
      className={cn("rounded-lg border border-border bg-card p-4 shadow-sm", className)}
      style={{ boxShadow: "var(--shadow-soft)" }}
    >
      <div className="mb-4 flex min-h-9 items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
