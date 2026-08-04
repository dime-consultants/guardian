"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Clock,
  FileText,
  AlertTriangle,
  Calendar,
  Loader2,
  Server,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/contexts/app-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import Link from "next/link";
import { AnalyticsOverviewResponse, TrendDataPoint } from "@/types/api";

const demoProcessingTrend: TrendDataPoint[] = [
  { date: "2026-01-01", value: 2400 },
  { date: "2026-02-01", value: 2210 },
  { date: "2026-03-01", value: 2890 },
  { date: "2026-04-01", value: 3100 },
  { date: "2026-05-01", value: 2847 },
];

const demoAccuracyTrend: TrendDataPoint[] = [
  { date: "2026-01-01", value: 93.4 },
  { date: "2026-02-01", value: 94.2 },
  { date: "2026-03-01", value: 95.8 },
  { date: "2026-04-01", value: 96.7 },
  { date: "2026-05-01", value: 97.2 },
];

const demoCategoryBreakdown = [
  { category: "Finance", count: 1250 },
  { category: "Operations", count: 890 },
  { category: "Logistics", count: 450 },
  { category: "Admin", count: 257 },
];

const demoOverview: AnalyticsOverviewResponse = {
  processing: {
    total: 2847,
    automated: 2750,
    manual: 97,
    trend: demoProcessingTrend,
  },
  accuracy: {
    current: 97.2,
    previous: 94.5,
    trend: demoAccuracyTrend,
  },
  efficiency: {
    timeSaved: 852,
    costSaved: 426,
  },
};

function AwaitingBackendState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="p-4 rounded-full bg-muted mb-4">
        <Server className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">
        Awaiting Backend Connection
      </h3>
      <p className="text-muted-foreground text-center max-w-md mb-6">
        Connect to your Django backend to view analytics data, or enable Demo Mode to preview with sample data.
      </p>
      <Link href="/settings">
        <Button variant="outline">Configure Backend</Button>
      </Link>
    </div>
  );
}

function formatMinutes(minutes: number) {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h${mins ? ` ${mins}m` : ""}`;
  }
  return `${minutes}m`;
}

export function AnalyticsPage() {
  const { demoMode, backendConnected, apiFetch } = useApp();
  const showEmptyState = !demoMode && !backendConnected;
  const [period, setPeriod] = useState<"week" | "month" | "quarter" | "year">("month");
  const [overview, setOverview] = useState<AnalyticsOverviewResponse | null>(demoMode ? demoOverview : null);
  const [processingTrend, setProcessingTrend] = useState<TrendDataPoint[]>(demoProcessingTrend);
  const [accuracyTrend, setAccuracyTrend] = useState<TrendDataPoint[]>(demoAccuracyTrend);
  const [categoryBreakdown, setCategoryBreakdown] = useState<{ category: string; count: number }[]>(demoCategoryBreakdown);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (demoMode) {
      setOverview(demoOverview);
      setProcessingTrend(demoProcessingTrend);
      setAccuracyTrend(demoAccuracyTrend);
      setCategoryBreakdown(demoCategoryBreakdown);
      setError(null);
      setIsLoading(false);
      return;
    }

    if (!backendConnected || !apiFetch) {
      setOverview(null);
      setProcessingTrend([]);
      setAccuracyTrend([]);
      setCategoryBreakdown([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    const loadAnalytics = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const overviewResponse = await apiFetch(`analytics/overview?period=${period}`);
        if (!overviewResponse.ok) {
          const payload = await overviewResponse.json().catch(() => null);
          throw new Error(payload?.detail || payload?.error || `Overview request failed (${overviewResponse.status})`);
        }

        const [processingResponse, accuracyResponse, categoryResponse] = await Promise.all([
          apiFetch(`analytics/charts/processing-trend?period=${period}`),
          apiFetch(`analytics/charts/accuracy-trend?period=${period}`),
          apiFetch(`analytics/charts/category-breakdown?period=${period}`),
        ]);

        if (!processingResponse.ok || !accuracyResponse.ok || !categoryResponse.ok) {
          const failed = [processingResponse, accuracyResponse, categoryResponse].find((res) => !res.ok);
          const payload = await failed?.json().catch(() => null);
          throw new Error(payload?.detail || payload?.error || `Chart request failed (${failed?.status})`);
        }

        const overviewData = await overviewResponse.json() as AnalyticsOverviewResponse;
        const processingData = await processingResponse.json();
        const accuracyData = await accuracyResponse.json();
        const categoryData = await categoryResponse.json();

        setOverview(overviewData);
        setProcessingTrend(processingData.data ?? []);
        setAccuracyTrend(accuracyData.data ?? []);
        setCategoryBreakdown(categoryData.data ?? []);
      } catch (loadError) {
        console.error("Analytics fetch error:", loadError);
        setError(loadError instanceof Error ? loadError.message : String(loadError));
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalytics();
  }, [demoMode, backendConnected, apiFetch, period]);

  const processingEfficiency = overview?.processing.total
    ? Number(((overview.processing.automated / overview.processing.total) * 100).toFixed(1))
    : 0;

  const manualInvoices = overview?.processing.manual ?? 0;
  const invoicesProcessed = overview?.processing.total ?? 0;
  const timeSaved = overview?.efficiency.timeSaved ?? 0;
  const costSaved = overview?.efficiency.costSaved ?? 0;
  const accuracyCurrent = overview?.accuracy.current ?? 0;
  const accuracyPrevious = overview?.accuracy.previous ?? 0;
  const accuracyChange = Number((accuracyCurrent - accuracyPrevious).toFixed(1));

  const accuracyPieData = [
    { name: "Accurate", value: accuracyCurrent, color: "oklch(0.6 0.15 160)" },
    { name: "Other", value: Math.max(0, 100 - accuracyCurrent), color: "oklch(0.7 0.1 60)" },
  ];

  return (
    <div className="space-y-6 pb-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2 md:gap-3">
            <BarChart3 className="h-6 md:h-7 w-6 md:w-7 text-primary flex-shrink-0" />
            Analytics
          </h2>
          <p className="text-muted-foreground mt-1 text-sm md:text-base line-clamp-2">
            Performance metrics, automation efficiency, and processing insights.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap sm:flex-shrink-0">
          {demoMode && (
            <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
              Demo Data
            </Badge>
          )}
          {!demoMode && !backendConnected && (
            <Badge variant="secondary" className="bg-muted text-muted-foreground">
              No Data Source
            </Badge>
          )}
          <Select
            value={period}
            onValueChange={(value) => setPeriod(value as typeof period)}
            disabled={showEmptyState}
          >
            <SelectTrigger className="w-40">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" disabled={showEmptyState} className="flex-shrink-0">Export</Button>
        </div>
      </div>

      {showEmptyState ? (
        <Card className="border-border bg-card">
          <AwaitingBackendState />
        </Card>
      ) : isLoading ? (
        <Card className="border-border bg-card p-10">
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div>
              <h3 className="text-lg font-semibold text-foreground">Loading analytics</h3>
              <p className="text-sm text-muted-foreground">Fetching metrics from the backend dashboard.</p>
            </div>
          </div>
        </Card>
      ) : error ? (
        <Card className="border-border bg-card p-8">
          <div className="space-y-3 text-center">
            <h3 className="text-lg font-semibold text-foreground">Unable to load analytics</h3>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Link href="/settings">
              <Button variant="outline">Verify backend settings</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:grid-cols-4">
            <Card className="border-border bg-card p-4 gap-1">
              <CardHeader className="p-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Processing Efficiency
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="text-2xl md:text-3xl font-bold text-card-foreground">{processingEfficiency}%</div>
                <div className="flex items-center gap-1 mt-0.5">
                  <TrendingUp className="h-3 w-3 text-chart-3 flex-shrink-0" />
                  <span className="text-xs text-chart-3">{accuracyChange >= 0 ? `+${accuracyChange}%` : `${accuracyChange}%`}</span>
                  <span className="text-xs text-muted-foreground">vs prior</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card p-4 gap-1">
              <CardHeader className="p-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Time Saved
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="text-2xl md:text-3xl font-bold text-card-foreground">{formatMinutes(timeSaved)}</div>
                <div className="flex items-center gap-1 mt-0.5">
                  <Clock className="h-3 w-3 text-chart-1 flex-shrink-0" />
                  <span className="text-xs text-muted-foreground">Automated</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card p-4 gap-1">
              <CardHeader className="p-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Invoices Processed
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="text-2xl md:text-3xl font-bold text-card-foreground">{invoicesProcessed.toLocaleString()}</div>
                <div className="flex items-center gap-1 mt-0.5">
                  <FileText className="h-3 w-3 text-chart-3 flex-shrink-0" />
                  <span className="text-xs text-muted-foreground">Total in period</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card p-4 gap-1">
              <CardHeader className="p-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Manual Invoices
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="text-2xl md:text-3xl font-bold text-card-foreground">{manualInvoices.toLocaleString()}</div>
                <div className="flex items-center gap-1 mt-0.5">
                  <AlertTriangle className="h-3 w-3 text-chart-5 flex-shrink-0" />
                  <span className="text-xs text-muted-foreground">Manual needed</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-card-foreground">Processing Trend</CardTitle>
                <CardDescription>Daily invoice volume over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] md:h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={processingTrend}>
                      <defs>
                        <linearGradient id="processingGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="oklch(0.45 0.15 250)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="oklch(0.45 0.15 250)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.88 0.01 250)" />
                      <XAxis dataKey="date" stroke="oklch(0.5 0.02 260)" fontSize={12} />
                      <YAxis stroke="oklch(0.5 0.02 260)" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "oklch(1 0 0)",
                          border: "1px solid oklch(0.88 0.01 250)",
                          borderRadius: "8px",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="oklch(0.45 0.15 250)"
                        fill="url(#processingGradient)"
                        strokeWidth={2}
                        name="Invoices"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-card-foreground">Accuracy Trend</CardTitle>
                <CardDescription>Daily processing accuracy over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] md:h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={accuracyTrend}>
                      <defs>
                        <linearGradient id="accuracyGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="oklch(0.6 0.15 160)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="oklch(0.6 0.15 160)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.88 0.01 250)" />
                      <XAxis dataKey="date" stroke="oklch(0.5 0.02 260)" fontSize={12} />
                      <YAxis stroke="oklch(0.5 0.02 260)" fontSize={12} domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "oklch(1 0 0)",
                          border: "1px solid oklch(0.88 0.01 250)",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => `${value}%`}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="oklch(0.6 0.15 160)"
                        fill="url(#accuracyGradient)"
                        strokeWidth={2}
                        name="Accuracy"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Row */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-card-foreground">Current Accuracy</CardTitle>
                <CardDescription>Percentage of jobs completed successfully</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={accuracyPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {accuracyPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "oklch(1 0 0)",
                          border: "1px solid oklch(0.88 0.01 250)",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => `${value}%`}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-4 mt-2">
                  {accuracyPieData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-xs text-muted-foreground">
                        {item.name}: {item.value}%
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-card-foreground">Category Breakdown</CardTitle>
                <CardDescription>Top invoice categories from the backend</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryBreakdown.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No category breakdown data available.</p>
                  ) : (
                    categoryBreakdown.map((item) => {
                      const maxCount = Math.max(...categoryBreakdown.map((row) => row.count), 1);
                      return (
                        <div key={item.category} className="flex items-center gap-4">
                          <div className="w-28 text-sm font-medium text-card-foreground">
                            {item.category}
                          </div>
                          <div className="flex-1">
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full"
                                style={{ width: `${(item.count / maxCount) * 100}%` }}
                              />
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-card-foreground">
                              {item.count.toLocaleString()} files
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
