"use client";

import {
  FileSpreadsheet,
  Download,
  Eye,
  Search,
  Clock,
  FileText,
  Server,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useApp } from "@/contexts/app-context";
import Link from "next/link";

const demoReports = [
  {
    id: "1",
    name: "Daily Reconciliation Report",
    description: "Invoice reconciliation summary for May 22, 2024",
    type: "daily",
    format: "xlsx",
    generatedAt: "Today, 09:00 AM",
    size: "1.2 MB",
    records: 247,
  },
  {
    id: "2",
    name: "Weekly Invoice Summary",
    description: "Week 20 invoice processing and variance analysis",
    type: "weekly",
    format: "xlsx",
    generatedAt: "May 19, 2024",
    size: "3.8 MB",
    records: 1847,
  },
  {
    id: "3",
    name: "Telephone Billing Analysis - May",
    description: "CU number breakdown and department allocation",
    type: "monthly",
    format: "xlsx",
    generatedAt: "May 15, 2024",
    size: "8.5 MB",
    records: 8450,
  },
  {
    id: "4",
    name: "KRA Tax Compliance Report",
    description: "Monthly tax filing preparation for May 2024",
    type: "monthly",
    format: "xlsx",
    generatedAt: "May 20, 2024",
    size: "2.1 MB",
    records: 2156,
  },
  {
    id: "5",
    name: "Variance Analysis Q2",
    description: "Quarterly variance trends and flagged invoices",
    type: "quarterly",
    format: "xlsx",
    generatedAt: "May 1, 2024",
    size: "12.4 MB",
    records: 15230,
  },
  {
    id: "6",
    name: "Utility Bills Reconciliation",
    description: "Fuel, water, electricity reconciliation for April",
    type: "monthly",
    format: "xlsx",
    generatedAt: "May 5, 2024",
    size: "890 KB",
    records: 342,
  },
];

const typeColors: Record<string, string> = {
  daily: "bg-chart-1/10 text-chart-1",
  weekly: "bg-chart-3/10 text-chart-3",
  monthly: "bg-chart-2/10 text-chart-2",
  quarterly: "bg-chart-4/10 text-chart-4",
};

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
  const { demoMode, backendConnected } = useApp();
  const showEmptyState = !demoMode && !backendConnected;
  const reports = demoMode ? demoReports : [];

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
          <Button className="bg-[#0D3B8E] text-white hover:bg-[#0D3B8E]/90" disabled={showEmptyState}>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:grid-cols-4">
            <Card className="border-[#E5E7EB] bg-white p-4 gap-0">
              <CardContent className="p-0">
                <div className="text-2xl md:text-3xl font-bold text-[#2B2B2B]">{reports.length}</div>
                <p className="text-sm text-[#6B7280] mt-0.5">Total Reports</p>
              </CardContent>
            </Card>
            <Card className="border-[#E5E7EB] bg-white p-4 gap-0">
              <CardContent className="p-0">
                <div className="text-2xl md:text-3xl font-bold text-[#2B2B2B]">
                  {reports.filter((r) => r.generatedAt.includes("Today")).length}
                </div>
                <p className="text-sm text-[#6B7280] mt-0.5">Generated Today</p>
              </CardContent>
            </Card>
            <Card className="border-[#E5E7EB] bg-white p-4 gap-0">
              <CardContent className="p-0">
                <div className="text-2xl md:text-3xl font-bold text-[#2B2B2B]">
                  {reports.reduce((acc, r) => acc + r.records, 0).toLocaleString()}
                </div>
                <p className="text-sm text-[#6B7280] mt-0.5">Total Records</p>
              </CardContent>
            </Card>
            <Card className="border-[#E5E7EB] bg-white p-4 gap-0">
              <CardContent className="p-0">
                <div className="text-2xl md:text-3xl font-bold text-[#2B2B2B]">28.9 MB</div>
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
                  <CardDescription>Download and view reconciliation reports</CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:flex-none">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6B7280]" />
                    <Input placeholder="Search reports..." className="pl-9 w-full sm:w-48 md:w-64" />
                  </div>
                  <Select defaultValue="all">
                    <SelectTrigger className="w-28 sm:w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center gap-4 p-4 rounded-lg bg-[#EEF2F7]/50 hover:bg-[#EEF2F7] transition-colors group"
                  >
                    <div className="p-2.5 rounded-lg bg-chart-3/10 flex-shrink-0">
                      <FileSpreadsheet className="h-5 w-5 text-chart-3" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="mb-1">
                        <span className="font-medium text-[#2B2B2B] text-sm leading-snug">
                          {report.name}
                        </span>
                        {" "}
                        <span
                          className={cn(
                            "inline-block text-xs px-2 py-0.5 rounded-full capitalize",
                            typeColors[report.type]
                          )}
                        >
                          {report.type}
                        </span>
                      </div>
                      <p className="text-xs text-[#6B7280] mb-1 line-clamp-1">
                        {report.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-[#6B7280]">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 flex-shrink-0" />
                          {report.generatedAt}
                        </span>
                        <span>{report.size}</span>
                        <span>{report.records.toLocaleString()} rec</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 md:gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <Button variant="outline" size="sm" className="px-2 md:px-3">
                        <Eye className="h-4 w-4 md:mr-2" />
                        <span className="hidden md:inline">Preview</span>
                      </Button>
                      <Button size="sm" className="bg-[#0D3B8E] text-white hover:bg-[#0D3B8E]/90 px-2 md:px-3">
                        <Download className="h-4 w-4 md:mr-2" />
                        <span className="hidden md:inline">Download</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
