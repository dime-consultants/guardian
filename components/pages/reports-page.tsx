"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  FileSpreadsheet,
  Download,
  Search,
  Clock,
  FileText,
  Server,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useApp } from "@/contexts/app-context";
import { toast } from "sonner";
import Link from "next/link";
import type { Report, ReportType, ReportFormat } from "@/types/api";

const demoReports: Report[] = [
  {
    id: "1", name: "Daily Reconciliation Report", type: "reconciliation", status: "ready",
    format: "xlsx", generatedAt: new Date().toISOString(), fileSize: 1_258_000,
    created_at: new Date().toISOString(),
  },
  {
    id: "2", name: "Weekly Invoice Summary", type: "billing", status: "ready",
    format: "xlsx", generatedAt: "2024-05-19T09:00:00Z", fileSize: 3_984_000,
    created_at: "2024-05-19T09:00:00Z",
  },
  {
    id: "3", name: "Q2 Variance Analysis", type: "analytics", status: "ready",
    format: "pdf", generatedAt: "2024-05-01T09:00:00Z", fileSize: 12_400_000,
    created_at: "2024-05-01T09:00:00Z",
  },
];

const typeColors: Record<string, string> = {
  reconciliation: "bg-chart-1/10 text-chart-1",
  billing: "bg-chart-3/10 text-chart-3",
  analytics: "bg-chart-2/10 text-chart-2",
  custom: "bg-chart-4/10 text-chart-4",
};

const statusColors: Record<string, string> = {
  ready: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
  generating: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300",
  error: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
};

function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function AwaitingBackendState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="p-4 rounded-full bg-[#EEF2F7] mb-4">
        <Server className="h-10 w-10 text-[#6B7280]" />
      </div>
      <h3 className="text-xl font-semibold text-[#2B2B2B] mb-2">
        Awaiting Backend Connection
      </h3>
      <p className="text-[#6B7280] text-center max-w-md mb-6">
        Connect to your Django backend to view reports, or enable Demo Mode to preview with sample data.
      </p>
      <Link href="/settings">
        <Button variant="outline">Configure Backend</Button>
      </Link>
    </div>
  );
}

export function ReportsPage() {
  const { demoMode, backendConnected, apiFetch } = useApp();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");

  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [genType, setGenType] = useState<ReportType>("custom");
  const [genFormat, setGenFormat] = useState<ReportFormat>("xlsx");
  const [genDateFrom, setGenDateFrom] = useState("");
  const [genDateTo, setGenDateTo] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const showEmptyState = !demoMode && !backendConnected;

  const loadReports = useCallback(async () => {
    if (demoMode) {
      setReports(demoReports);
      return;
    }
    if (!backendConnected || !apiFetch) return;

    setIsLoading(true);
    try {
      const res = await apiFetch("reports/");
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports ?? []);
      }
    } catch (error) {
      console.error("Error loading reports:", error);
    } finally {
      setIsLoading(false);
    }
  }, [demoMode, backendConnected, apiFetch]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  // Poll while any report is still generating — there is no generic WS
  // notification listener elsewhere in this app to piggyback on, so this
  // stays self-contained rather than inventing new shared infrastructure.
  useEffect(() => {
    const hasGenerating = reports.some((r) => r.status === "generating");
    if (hasGenerating && !pollRef.current) {
      pollRef.current = setInterval(loadReports, 4000);
    } else if (!hasGenerating && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [reports, loadReports]);

  const generateReport = async () => {
    if (!apiFetch) return;
    setIsGenerating(true);
    try {
      const parameters: Record<string, string> = {};
      if (genDateFrom) parameters.date_from = genDateFrom;
      if (genDateTo) parameters.date_to = genDateTo;

      const res = await apiFetch("reports/generate/", {
        method: "POST",
        body: { type: genType, format: genFormat, parameters },
      });

      if (res.ok) {
        setShowGenerateDialog(false);
        setGenDateFrom("");
        setGenDateTo("");
        toast.success("Report generation started");
        loadReports();
      } else {
        const err: Record<string, any> = await res.json().catch(() => ({}));
        toast.error("Failed to generate report", {
          description: err.detail || Object.values(err)[0]?.[0] || "Unknown error",
        });
      }
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Failed to generate report");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadReport = async (report: Report) => {
    if (!apiFetch) return;
    try {
      const res = await apiFetch(`reports/${report.id}/download/`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${report.name}.${report.format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error("Download failed", {
          description: err.error?.message || "The report could not be downloaded.",
        });
      }
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Download failed");
    }
  };

  const filteredReports = reports.filter((r) => {
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || r.type === filterType;
    return matchesSearch && matchesType;
  });

  const stats = {
    total: reports.length,
    generatedToday: reports.filter((r) => {
      const d = new Date(r.created_at);
      const now = new Date();
      return d.toDateString() === now.toDateString();
    }).length,
    storageUsed: reports.reduce((acc, r) => acc + (r.fileSize || 0), 0),
  };

  return (
    <div className="space-y-6 pb-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-[#2B2B2B] flex items-center gap-2 md:gap-3">
            <FileSpreadsheet className="h-6 md:h-7 w-6 md:w-7 text-[#0D3B8E] flex-shrink-0" />
            Reports
          </h2>
          <p className="text-[#6B7280] mt-1 text-sm md:text-base line-clamp-2">
            Access generated reports, reconciliation summaries, and analysis outputs.
          </p>
        </div>
        <div className="flex items-center gap-2 sm:flex-shrink-0">
          {demoMode && (
            <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
              Demo Data
            </Badge>
          )}
          {!demoMode && !backendConnected && (
            <Badge variant="secondary" className="bg-[#EEF2F7] text-[#6B7280]">
              No Data Source
            </Badge>
          )}
          <Button
            className="bg-[#0D3B8E] text-white hover:bg-[#0D3B8E]/90"
            disabled={showEmptyState || demoMode}
            onClick={() => setShowGenerateDialog(true)}
          >
            <FileText className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      {showEmptyState ? (
        <Card className="border-[#E5E7EB] bg-white">
          <AwaitingBackendState />
        </Card>
      ) : (
        <>
          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card className="border-[#E5E7EB] bg-white p-4 gap-0">
              <CardContent className="p-0">
                <div className="text-2xl md:text-3xl font-bold text-[#2B2B2B]">{stats.total}</div>
                <p className="text-sm text-[#6B7280] mt-0.5">Total Reports</p>
              </CardContent>
            </Card>
            <Card className="border-[#E5E7EB] bg-white p-4 gap-0">
              <CardContent className="p-0">
                <div className="text-2xl md:text-3xl font-bold text-[#2B2B2B]">{stats.generatedToday}</div>
                <p className="text-sm text-[#6B7280] mt-0.5">Generated Today</p>
              </CardContent>
            </Card>
            <Card className="border-[#E5E7EB] bg-white p-4 gap-0">
              <CardContent className="p-0">
                <div className="text-2xl md:text-3xl font-bold text-[#2B2B2B]">{formatBytes(stats.storageUsed)}</div>
                <p className="text-sm text-[#6B7280] mt-0.5">Storage Used</p>
              </CardContent>
            </Card>
          </div>

          {/* Reports List */}
          <Card className="border-[#E5E7EB] bg-white">
            <CardHeader>
              <div className="flex flex-wrap items-start gap-3">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-[#2B2B2B]">Generated Reports</CardTitle>
                  <CardDescription>Download reconciliation, billing, and analytics reports</CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:flex-none">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6B7280]" />
                    <Input
                      placeholder="Search reports..."
                      className="pl-9 w-full sm:w-48 md:w-64"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-28 sm:w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="reconciliation">Reconciliation</SelectItem>
                      <SelectItem value="billing">Billing</SelectItem>
                      <SelectItem value="analytics">Analytics</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading && reports.length === 0 ? (
                <div className="flex items-center justify-center py-10 text-[#6B7280]">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Loading reports...
                </div>
              ) : filteredReports.length === 0 ? (
                <div className="text-center py-10 text-sm text-[#6B7280]">
                  No reports yet. Click "Generate Report" to create one.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredReports.map((report) => (
                    <div
                      key={report.id}
                      className="flex items-center gap-4 p-4 rounded-lg bg-[#EEF2F7]/50 hover:bg-[#EEF2F7] transition-colors group"
                    >
                      <div className="p-2.5 rounded-lg bg-chart-3/10 flex-shrink-0">
                        {report.status === "error" ? (
                          <AlertCircle className="h-5 w-5 text-destructive" />
                        ) : (
                          <FileSpreadsheet className="h-5 w-5 text-chart-3" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="mb-1 flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-[#2B2B2B] text-sm leading-snug">
                            {report.name}
                          </span>
                          <span
                            className={cn(
                              "inline-block text-xs px-2 py-0.5 rounded-full capitalize",
                              typeColors[report.type],
                            )}
                          >
                            {report.type}
                          </span>
                          <span
                            className={cn(
                              "inline-block text-xs px-2 py-0.5 rounded-full capitalize",
                              statusColors[report.status],
                            )}
                          >
                            {report.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-[#6B7280]">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 flex-shrink-0" />
                            {report.generatedAt ? new Date(report.generatedAt).toLocaleString() : "Not yet generated"}
                          </span>
                          <span className="uppercase">{report.format}</span>
                          {report.fileSize > 0 && <span>{formatBytes(report.fileSize)}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 md:gap-2">
                        <Button
                          size="sm"
                          className="bg-[#0D3B8E] text-white hover:bg-[#0D3B8E]/90 px-2 md:px-3"
                          disabled={report.status !== "ready"}
                          onClick={() => downloadReport(report)}
                        >
                          <Download className="h-4 w-4 md:mr-2" />
                          <span className="hidden md:inline">Download</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Generate Report Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Report</DialogTitle>
            <DialogDescription>
              Runs as a background job — the report will appear in the list as "generating" until it's ready.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={genType} onValueChange={(v) => setGenType(v as ReportType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reconciliation">Reconciliation</SelectItem>
                    <SelectItem value="billing">Billing</SelectItem>
                    <SelectItem value="analytics">Analytics</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Format</Label>
                <Select value={genFormat} onValueChange={(v) => setGenFormat(v as ReportFormat)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>From (optional)</Label>
                <Input type="date" value={genDateFrom} onChange={(e) => setGenDateFrom(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>To (optional)</Label>
                <Input type="date" value={genDateTo} onChange={(e) => setGenDateTo(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>Cancel</Button>
            <Button onClick={generateReport} disabled={isGenerating}>
              {isGenerating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}