import Link from "next/link";

import type { QuickAction } from "./dashboard-types";

interface QuickActionsGridProps {
  actions: QuickAction[];
}

export function QuickActionsGrid({ actions }: QuickActionsGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Link
            key={action.title}
            href={action.href}
            className="flex min-h-[82px] flex-col justify-between rounded-lg border border-border bg-card p-3 text-sm shadow-sm transition hover:border-primary/30 hover:bg-accent/40"
          >
            <Icon className="size-4 text-primary" />
            <span className="font-medium text-foreground">{action.title}</span>
          </Link>
        );
      })}
    </div>
  );
}
