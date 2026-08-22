import { TrendingDown, TrendingUp } from "lucide-react";

import type { MetricCardData } from "./dashboard-types";

interface MetricCardProps {
  metric: MetricCardData;
  loading?: boolean;
}

export function MetricCard({ metric, loading }: MetricCardProps) {
  const Icon = metric.icon;
  const trendIsPositive = metric.changeType === "positive";
  const TrendIcon = trendIsPositive ? TrendingUp : TrendingDown;

  return (
    <article className="bank-card-surface relative min-h-[104px] rounded-lg border border-border/80 bg-card/95 p-4">
      {loading && <div className="absolute inset-0 rounded-lg bg-background/70" />}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">{metric.title}</p>
          <p className="mt-1 text-2xl font-semibold leading-none text-foreground">{metric.value}</p>
        </div>
        <div className="flex size-9 items-center justify-center rounded-md border border-primary/10 bg-primary/10 text-primary">
          <Icon className="size-4" />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 text-xs">
        <span className={trendIsPositive ? "inline-flex items-center gap-1 text-success" : "inline-flex items-center gap-1 text-error"}>
          <TrendIcon className="size-3.5" />
          {metric.change}
        </span>
        <span className="truncate text-muted-foreground">{metric.description}</span>
      </div>
    </article>
  );
}
