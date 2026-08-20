import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { ActivityItem } from "./dashboard-types";
import { DashboardSection } from "./dashboard-section";
import { activityStatusStyles } from "./dashboard-utils";

interface RecentActivityCardProps {
  activities: ActivityItem[];
}

export function RecentActivityCard({ activities }: RecentActivityCardProps) {
  return (
    <DashboardSection
      title="Recent Activity"
      className="lg:col-span-5"
      action={<Button variant="ghost" size="sm" className="h-8 px-2 text-xs">See All</Button>}
    >
      <div className="space-y-2">
        {activities.slice(0, 4).map((activity) => {
          const status = activityStatusStyles[activity.status];
          const Icon = status.icon;
          return (
            <div key={activity.id} className="flex items-center gap-3 rounded-md border border-border/70 p-3">
              <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-md", status.tone)}>
                <Icon className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{activity.title}</p>
                <p className="truncate text-xs text-muted-foreground">{activity.description}</p>
              </div>
              <span className="hidden text-xs text-muted-foreground sm:block">{activity.timestamp}</span>
            </div>
          );
        })}
      </div>
    </DashboardSection>
  );
}
