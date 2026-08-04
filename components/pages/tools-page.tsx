"use client";

import { useEffect, useState } from "react";
import {
  LucideIcon,
  Wrench,
  FileType,
  TableProperties,
  GitCompare,
  Download,
  Loader2,
  Server,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApp } from "@/contexts/app-context";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface BackendTool {
  id: number;
  name: string;
  display_name?: string;
  description?: string;
  category?: string;
  category_display?: string;
  enabled?: boolean;
  updated_at?: string;
  created_at?: string;
  last_run?: string;
  is_safe?: boolean;
}

interface ToolCard {
  id: number | string;
  name: string;
  description: string;
  category: string;
  status: string;
  lastRun: string;
  icon: LucideIcon;
  isSafe?: boolean;
  callCount?: number;
  successCount?: number;
}

const demoTools: ToolCard[] = [
  {
    id: "txt-to-xlsx",
    name: "TXT to XLSX Converter",
    description: "Convert invoice data from .txt format to structured Excel files.",
    category: "Conversion",
    status: "ready",
    lastRun: "2 hours ago",
    icon: FileType,
  },
  {
    id: "data-cleaning",
    name: "Data Cleaning Pipeline",
    description: "Clean and format data into desired report structure.",
    category: "Processing",
    status: "ready",
    lastRun: "1 hour ago",
    icon: TableProperties,
  },
  {
    id: "reconciliation",
    name: "Invoice Reconciliation",
    description: "Compare invoices against ACON and KRA records.",
    category: "Analysis",
    status: "ready",
    lastRun: "30 minutes ago",
    icon: GitCompare,
  },
  {
    id: "variance-flagging",
    name: "Variance Flagging",
    description: "Automatically flag differences in invoice data.",
    category: "Analysis",
    status: "ready",
    lastRun: "45 minutes ago",
    icon: Wrench,
  },
];

const categoryIcons: Record<string, LucideIcon> = {
  extraction: FileType,
  transformation: TableProperties,
  reconciliation: GitCompare,
  report: Download,
  analysis: GitCompare,
  utility: Server,
  conversion: FileType,
  processing: TableProperties,
  default: Wrench,
};

function AwaitingBackendState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="p-4 rounded-full bg-muted mb-4">
        <Server className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">Awaiting Backend Connection</h3>
      <p className="text-muted-foreground text-center max-w-md mb-6">
        Connect to your Django backend to use the tools page, or enable Demo Mode to preview sample data.
      </p>
      <Link href="/settings">
        <Button variant="outline">Configure Backend</Button>
      </Link>
    </div>
  );
}

function normalizeToolResponse(responseData: any): BackendTool[] {
  if (Array.isArray(responseData)) {
    return responseData;
  }

  if (responseData?.tools && Array.isArray(responseData.tools)) {
    return responseData.tools;
  }

  if (responseData?.results && Array.isArray(responseData.results)) {
    return responseData.results;
  }

  return [];
}

function normalizeCallsResponse(responseData: any) {
  if (Array.isArray(responseData)) return responseData;
  if (responseData?.calls && Array.isArray(responseData.calls)) return responseData.calls;
  if (responseData?.results && Array.isArray(responseData.results)) return responseData.results;
  return [];
}

function formatLastRun(tool: BackendTool) {
  const timestamp = tool.updated_at || tool.created_at || tool.last_run || null;
  if (!timestamp) {
    return "Ready";
  }

  try {
    return new Date(timestamp).toLocaleString();
  } catch {
    return String(timestamp);
  }
}

export function ToolsPage() {
  const { demoMode, backendConnected, apiFetch, setBackendConnected } = useApp();
  const [tools, setTools] = useState<ToolCard[]>(demoMode ? demoTools : []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [calls, setCalls] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [runningTool, setRunningTool] = useState<string | null>(null);

  useEffect(() => {
    if (demoMode) {
      setTools(demoTools);
      setError(null);
      return;
    }

    if (!apiFetch) {
      setTools([]);
      setError("API fetch is unavailable.");
      return;
    }

    const loadTools = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch tools and recent calls in parallel
        const [toolsResp, callsResp] = await Promise.all([
          apiFetch("tools/"),
          apiFetch("tools/calls/?page=1"),
        ]);

        const toolsPayload = await toolsResp.json().catch(() => null);
        const callsPayload = await callsResp.json().catch(() => null);

        if (!toolsResp.ok) {
          const message = toolsPayload?.detail || toolsPayload?.error || toolsPayload?.message || "Failed to load tools.";
          throw new Error(message);
        }

        const backendTools = normalizeToolResponse(toolsPayload);
        const backendCalls = normalizeCallsResponse(callsPayload);

        if (backendTools.length === 0) {
          throw new Error("The backend returned no tools.");
        }

        // Aggregate call counts per tool
        const callMap: Record<string, {calls:number; success:number}> = {};
        backendCalls.forEach((c: any) => {
          const name = c.tool_name || c.tool_display || c.tool?.name || String(c.tool);
          callMap[name] = callMap[name] || { calls: 0, success: 0 };
          callMap[name].calls += 1;
          if (c.status === "success") callMap[name].success += 1;
        });

        setTools(
          backendTools.map((tool) => ({
            id: tool.id,
            name: tool.display_name || tool.name,
            description: tool.description || "No description available.",
            category: tool.category_display || tool.category || "General",
            status: tool.enabled === false ? "disabled" : "ready",
            lastRun: formatLastRun(tool),
            icon: categoryIcons[tool.category || "default"] || Wrench,
            isSafe: tool.is_safe ?? true,
            callCount: callMap[tool.display_name || tool.name]?.calls ?? 0,
            successCount: callMap[tool.display_name || tool.name]?.success ?? 0,
          }))
        );

        setCalls(backendCalls);

        if (!backendConnected) {
          setBackendConnected(true);
        }
      } catch (loadError) {
        console.error("Failed to load tools:", loadError);
        setError(loadError instanceof Error ? loadError.message : String(loadError));
        setTools([]);
        setCalls([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadTools();
  }, [apiFetch, backendConnected, demoMode, setBackendConnected]);

  const categories = [
    "All",
    "extraction",
    "transformation",
    "reconciliation",
    "analysis",
    "report",
    "utility",
  ];

  const filteredTools = tools.filter((t) => {
    if (!selectedCategory || selectedCategory === "All") return true;
    return (t.category || "").toLowerCase().includes(selectedCategory.toLowerCase());
  });

  const stats = {
    totalTools: tools.length,
    totalExecutions: calls.length,
    successfulCalls: calls.filter((c) => c.status === "success").length,
    failedCalls: calls.filter((c) => c.status === "error").length,
    avgDuration: calls.length ? Math.round(calls.reduce((s, c) => s + (c.duration_ms || c.duration || 0), 0) / calls.length) : 0,
  };

  const runTool = async (tool: ToolCard) => {
    if (!apiFetch) return;
    setRunningTool(String(tool.id));
    try {
      const resp = await apiFetch("tools/run/", { method: "POST", body: { tool_name: tool.name, arguments: {} } });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        throw new Error(data?.error || data?.detail || "Failed to run tool");
      }

      // Refresh calls and tools counts
      const callsResp = await apiFetch("tools/calls/?page=1");
      const callsPayload = await callsResp.json().catch(() => null);
      const backendCalls = normalizeCallsResponse(callsPayload);
      setCalls(backendCalls);

      // Recompute call counts on tools
      const callMap: Record<string, {calls:number; success:number}> = {};
      backendCalls.forEach((c: any) => {
        const name = c.tool_name || c.tool_display || c.tool?.name || String(c.tool);
        callMap[name] = callMap[name] || { calls: 0, success: 0 };
        callMap[name].calls += 1;
        if (c.status === "success") callMap[name].success += 1;
      });
      setTools((prev) => prev.map((p) => ({ ...p, callCount: callMap[p.name]?.calls ?? 0, successCount: callMap[p.name]?.success ?? 0 })));
    } catch (err) {
      console.error("Run tool error:", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRunningTool(null);
    }
  };

  const actualConnected = backendConnected || tools.length > 0;
  const showEmptyState = !demoMode && !actualConnected && !isLoading && !error;

  return (
    <div className="space-y-6 pb-2">
      <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2 md:gap-3">
            <Wrench className="h-6 md:h-7 w-6 md:w-7 text-primary flex-shrink-0" />
            Data Tools
          </h2>
          <p className="text-muted-foreground mt-1 text-sm line-clamp-2">
            Fetch and display available backend tools for data processing.
          </p>
        </div>
        <div className="flex items-center gap-2 sm:flex-shrink-0">
          {demoMode && <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">Demo Data</Badge>}
          {!demoMode && actualConnected && <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">Connected</Badge>}
          {!demoMode && !actualConnected && <Badge variant="secondary" className="bg-muted text-muted-foreground">No Data Source</Badge>}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <div className="w-full sm:w-48">
          <Select onValueChange={(v) => setSelectedCategory(v)} value={selectedCategory || "All"}>
            <SelectTrigger>
              <SelectValue placeholder="Filter category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">Tools: {stats.totalTools}</Badge>
          <Badge variant="outline">Runs: {stats.totalExecutions}</Badge>
          <Badge variant="outline">Success: {stats.successfulCalls}</Badge>
          <Badge variant="outline">Fail: {stats.failedCalls}</Badge>
        </div>
      </div>

      {showEmptyState ? (
        <Card className="border-border bg-card">
          <AwaitingBackendState />
        </Card>
      ) : (
        <>
          {isLoading ? (
            <Card className="border-border bg-card p-8">
              <div className="flex flex-col items-center justify-center gap-4 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Loading tools...</h3>
                  <p className="text-sm text-muted-foreground">Fetching available tools from the backend.</p>
                </div>
              </div>
            </Card>
          ) : error ? (
            <Card className="border-border bg-card p-8">
              <div className="space-y-4 text-center">
                <h3 className="text-lg font-semibold text-foreground">Unable to load tools</h3>
                <p className="text-sm text-muted-foreground">{error}</p>
                <Link href="/settings">
                  <Button variant="outline">Check backend configuration</Button>
                </Link>
              </div>
            </Card>
          ) : tools.length === 0 ? (
            <Card className="border-border bg-card p-8">
              <div className="space-y-3 text-center">
                <h3 className="text-lg font-semibold text-foreground">No tools available</h3>
                <p className="text-sm text-muted-foreground">
                  Your backend is connected, but no enabled tools were returned.
                </p>
              </div>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredTools.map((tool) => (
                <Card
                  key={tool.id}
                  className={cn(
                    "border-border bg-card cursor-pointer transition-all hover:border-primary/50 hover:shadow-md p-3 gap-2",
                    selectedTool === String(tool.id) ? "border-primary ring-1 ring-primary" : ""
                  )}
                  onClick={() => setSelectedTool(String(tool.id))}
                >
                  <CardHeader className="p-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                          <tool.icon className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-sm text-card-foreground leading-snug">{tool.name}</CardTitle>
                          <div className="text-xs text-muted-foreground">{tool.category}</div>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs flex-shrink-0">
                        {tool.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{tool.description}</p>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 flex-shrink-0" />
                          <span>{tool.lastRun}</span>
                        </div>
                        <span>Calls: {tool.callCount ?? 0}</span>
                      </div>
                      <Button
                        size="sm"
                        className="h-7 text-xs px-3 flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (tool.isSafe) runTool(tool);
                        }}
                        disabled={!tool.isSafe || runningTool === String(tool.id)}
                      >
                        {runningTool === String(tool.id) ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          "Run"
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
