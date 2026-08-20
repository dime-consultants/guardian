"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import { useApp } from "@/contexts/app-context";

import { BackendEmptyState } from "./backend-empty-state";
import {
  demoActivity,
  demoExceptions,
  demoMetrics,
  demoProcessingData,
  quickActions,
} from "./dashboard-data";
import { ExceptionTable } from "./exception-table";
import { IssueBreakdownCard } from "./issue-breakdown-card";
import { MetricCard } from "./metric-card";
import { QuickActionsGrid } from "./quick-actions-grid";
import { RecentActivityCard } from "./recent-activity-card";
import { ScrutinyChart } from "./scrutiny-chart";
import type { ActivityItem, MetricCardData, ProcessingDataPoint } from "./dashboard-types";
import { buildIssueBreakdown, formatRelativeTime, iconForMetric } from "./dashboard-utils";

export function DashboardHome() {
  const { demoMode, backendConnected, backendUrl, apiFetch } = useApp();
  const [metrics, setMetrics] = useState<MetricCardData[]>([]);
  const [processingData, setProcessingData] = useState<ProcessingDataPoint[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (demoMode) {
      setMetrics(demoMetrics);
      setProcessingData(demoProcessingData);
      setRecentActivity(demoActivity);
      return;
    }

    if (!backendConnected) {
      setMetrics([]);
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
            setMetrics(
              statsData.stats.map((stat: Record<string, unknown>) => ({
                ...stat,
                icon: iconForMetric(String(stat.title)),
              })) as MetricCardData[],
            );
          }
        }

        const processingRes = await apiFetch("dashboard/processing/");
        if (processingRes.ok) {
          const processingJson = await processingRes.json();
          if (processingJson.data) setProcessingData(processingJson.data);
        }

        const activityRes = await apiFetch("dashboard/recent-activity/");
        if (activityRes.ok) {
          const activityJson = await activityRes.json();
          if (activityJson.activities) {
            setRecentActivity(
              activityJson.activities.map((activity: ActivityItem) => ({
                ...activity,
                timestamp: formatRelativeTime(activity.timestamp),
              })),
            );
          }
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 60000);
    return () => clearInterval(interval);
  }, [apiFetch, backendConnected, backendUrl, demoMode]);

  const metricData = metrics.length ? metrics : demoMetrics;
  const chartData = processingData.length ? processingData : demoProcessingData;
  const activityData = recentActivity.length ? recentActivity : demoActivity;
  const issueBreakdown = useMemo(() => buildIssueBreakdown(metricData), [metricData]);
  const showEmptyState = !demoMode && !backendConnected;

  return (
    <div className="space-y-5 pb-3">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Guardian Bank reconciliation overview</p>
        </div>
        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" />
            Refreshing
          </div>
        )}
      </div>

      {showEmptyState ? (
        <BackendEmptyState />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metricData.slice(0, 4).map((metric) => (
              <MetricCard key={metric.title} metric={metric} loading={isLoading && !demoMode} />
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-12">
            <ScrutinyChart data={chartData} />
            <IssueBreakdownCard data={issueBreakdown} />
          </div>

          <div className="grid gap-4 lg:grid-cols-12">
            <RecentActivityCard activities={activityData} />
            <ExceptionTable rows={demoExceptions} />
          </div>

          <QuickActionsGrid actions={quickActions} />
        </>
      )}
    </div>
  );
}
