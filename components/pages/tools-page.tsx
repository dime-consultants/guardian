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
  Play,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useApp } from "@/contexts/app-context";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { type JSONSchema, type JSONSchemaProperty } from "@/lib/json-schema-form";
import { ToolRunForm, missingRequiredArgs } from "@/components/tool-run-form";
import { CustomToolBuilderDialog } from "@/components/tools/custom-tool-builder-dialog";
import type { CustomTool } from "@/types/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, FlaskConical } from "lucide-react";

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
  parameters_schema?: JSONSchema;
}

interface ToolCard {
  id: number | string;
  /** apiName is the raw snake_case identifier the backend expects in
   * tool_name (ToolDefinition.name) — distinct from `name` below, which is
   * the human-readable display label. Conflating the two previously meant
   * every run/call-count lookup silently failed for any tool whose
   * display_name differed from its name (i.e. all of them). */
  apiName: string;
  name: string;
  description: string;
  category: string;
  status: string;
  lastRun: string;
  icon: LucideIcon;
  isSafe?: boolean;
  callCount?: number;
  successCount?: number;
  parametersSchema?: JSONSchema;
}

const demoTools: ToolCard[] = [
  {
    id: "txt-to-xlsx",
    apiName: "txt-to-xlsx",
    name: "TXT to XLSX Converter",
    description: "Convert invoice data from .txt format to structured Excel files.",
    category: "Conversion",
    status: "ready",
    lastRun: "2 hours ago",
    icon: FileType,
  },
  {
    id: "data-cleaning",
    apiName: "data-cleaning",
    name: "Data Cleaning Pipeline",
    description: "Clean and format data into desired report structure.",
    category: "Processing",
    status: "ready",
    lastRun: "1 hour ago",
    icon: TableProperties,
  },
  {
    id: "reconciliation",
    apiName: "reconciliation",
    name: "Invoice Reconciliation",
    description: "Compare invoices against ACON and KRA records.",
    category: "Analysis",
    status: "ready",
    lastRun: "30 minutes ago",
    icon: GitCompare,
  },
  {
    id: "variance-flagging",
    apiName: "variance-flagging",
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
      <div className="p-4 rounded-full bg-[#EEF2F7] mb-4">
        <Server className="h-10 w-10 text-[#6B7280]" />
      </div>
      <h3 className="text-xl font-semibold text-[#2B2B2B] mb-2">Awaiting Backend Connection</h3>
      <p className="text-[#6B7280] text-center max-w-md mb-6">
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

  // Run dialog — schema-driven argument input for the selected tool.
  const [runDialogTool, setRunDialogTool] = useState<ToolCard | null>(null);
  const [runArgs, setRunArgs] = useState<Record<string, unknown>>({});
  const [runResult, setRunResult] = useState<any>(null);
  const [runError, setRunError] = useState<string | null>(null);

  // Custom (user-defined) tools.
  const [customTools, setCustomTools] = useState<CustomTool[]>([]);
  const [isLoadingCustom, setIsLoadingCustom] = useState(false);
  const [customToolsError, setCustomToolsError] = useState<string | null>(null);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<CustomTool | null>(null);
  const [deletingTool, setDeletingTool] = useState<CustomTool | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Custom tool Test dialog — mirrors the built-in Run dialog above, but
  // calls POST tools/custom/<id>/test/ instead of tools/run/.
  const [testDialogTool, setTestDialogTool] = useState<CustomTool | null>(null);
  const [testArgs, setTestArgs] = useState<Record<string, unknown>>({});
  const [testResult, setTestResult] = useState<any>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

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

        // Aggregate call counts per tool. Keyed by the raw API name
        // (tool_name), which is what ToolCallSerializer always populates —
        // tool_display can be blank, so it's a fallback key only, not the
        // primary one.
        const callMap: Record<string, {calls:number; success:number}> = {};
        backendCalls.forEach((c: any) => {
          const key = c.tool_name || c.tool_display || c.tool?.name || String(c.tool);
          callMap[key] = callMap[key] || { calls: 0, success: 0 };
          callMap[key].calls += 1;
          if (c.status === "success") callMap[key].success += 1;
        });

        setTools(
          backendTools.map((tool) => ({
            id: tool.id,
            // apiName is the raw snake_case name (ToolDefinition.name) —
            // this is what /tools/run/ and ToolCall.tool_name expect. `name`
            // below is the human-readable label for display only; they must
            // never be conflated (that bug meant Run and call counts never
            // worked for any tool whose display_name != name).
            apiName: tool.name,
            name: tool.display_name || tool.name,
            description: tool.description || "No description available.",
            category: tool.category_display || tool.category || "General",
            status: tool.enabled === false ? "disabled" : "ready",
            lastRun: formatLastRun(tool),
            icon: categoryIcons[tool.category || "default"] || Wrench,
            isSafe: tool.is_safe ?? true,
            callCount: callMap[tool.name]?.calls ?? 0,
            successCount: callMap[tool.name]?.success ?? 0,
            parametersSchema: tool.parameters_schema,
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

  const loadCustomTools = async () => {
    if (demoMode || !apiFetch) {
      setCustomTools([]);
      return;
    }
    setIsLoadingCustom(true);
    setCustomToolsError(null);
    try {
      const resp = await apiFetch("tools/custom/");
      const payload = await resp.json().catch(() => null);
      if (!resp.ok) {
        throw new Error(payload?.detail || payload?.error || "Failed to load custom tools.");
      }
      setCustomTools(normalizeToolResponse(payload) as unknown as CustomTool[]);
    } catch (err) {
      setCustomToolsError(err instanceof Error ? err.message : String(err));
      setCustomTools([]);
    } finally {
      setIsLoadingCustom(false);
    }
  };

  useEffect(() => {
    loadCustomTools();
  }, [apiFetch, demoMode]);

  const deleteCustomTool = async () => {
    if (!apiFetch || !deletingTool) return;
    setIsDeleting(true);
    try {
      const resp = await apiFetch(`tools/custom/${deletingTool.id}/`, { method: "DELETE" });
      if (!resp.ok && resp.status !== 204) {
        const payload = await resp.json().catch(() => null);
        throw new Error(payload?.detail || "Failed to disable tool.");
      }
      toast.success("Custom tool disabled");
      setDeletingTool(null);
      loadCustomTools();
    } catch (err) {
      toast.error("Error", { description: err instanceof Error ? err.message : String(err) });
    } finally {
      setIsDeleting(false);
    }
  };

  const testCustomTool = async (tool: CustomTool, args: Record<string, unknown>) => {
    if (!apiFetch) return;
    setIsTesting(true);
    setTestError(null);
    setTestResult(null);
    try {
      const resp = await apiFetch(`tools/custom/${tool.id}/test/`, {
        method: "POST",
        body: { arguments: args },
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        throw new Error(data?.error || data?.detail || "Failed to test tool");
      }
      setTestResult(data.result ?? null);
      if (data.result && data.result.ok === false) {
        toast.error("Test failed", { description: data.result.error || "Unknown error" });
      } else {
        toast.success("Test succeeded", { description: `${tool.display_name} ran successfully.` });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setTestError(msg);
      toast.error("Error", { description: msg });
    } finally {
      setIsTesting(false);
    }
  };

  const openTestDialog = (tool: CustomTool) => {
    setTestDialogTool(tool);
    setTestArgs({});
    setTestResult(null);
    setTestError(null);
  };

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

  const runTool = async (tool: ToolCard, args: Record<string, unknown>) => {
    if (!apiFetch) return;
    setRunningTool(String(tool.id));
    setRunError(null);
    setRunResult(null);
    try {
      const resp = await apiFetch("tools/run/", {
        method: "POST",
        body: { tool_name: tool.apiName, arguments: args },
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        throw new Error(data?.error || data?.detail || "Failed to run tool");
      }

      setRunResult(data.result ?? null);
      if (data.result && data.result.ok === false) {
        toast.error("Tool run failed", { description: data.result.error || "Unknown error" });
      } else {
        toast.success("Tool executed", { description: `${tool.name} completed successfully.` });
      }

      // Refresh calls and tools counts
      const callsResp = await apiFetch("tools/calls/?page=1");
      const callsPayload = await callsResp.json().catch(() => null);
      const backendCalls = normalizeCallsResponse(callsPayload);
      setCalls(backendCalls);

      // Recompute call counts on tools — keyed by apiName (raw tool_name),
      // matching how the tools list itself is built above.
      const callMap: Record<string, {calls:number; success:number}> = {};
      backendCalls.forEach((c: any) => {
        const key = c.tool_name || c.tool_display || c.tool?.name || String(c.tool);
        callMap[key] = callMap[key] || { calls: 0, success: 0 };
        callMap[key].calls += 1;
        if (c.status === "success") callMap[key].success += 1;
      });
      setTools((prev) => prev.map((p) => ({
        ...p,
        callCount: callMap[p.apiName]?.calls ?? 0,
        successCount: callMap[p.apiName]?.success ?? 0,
      })));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Run tool error:", err);
      setRunError(msg);
      toast.error("Error", { description: msg });
    } finally {
      setRunningTool(null);
    }
  };

  /** Tools with no declared parameters run immediately on click; tools that
   * take arguments open a schema-driven form first (parameters_schema comes
   * straight from the backend's ToolDefinition, so this stays in sync with
   * whatever tools are registered without any frontend-side hardcoding). */
  const openRunDialog = (tool: ToolCard) => {
    const props = tool.parametersSchema?.properties || {};
    if (Object.keys(props).length === 0) {
      runTool(tool, {});
      return;
    }
    setRunDialogTool(tool);
    setRunArgs({});
    setRunResult(null);
    setRunError(null);
  };

  const actualConnected = backendConnected || tools.length > 0;
  const showEmptyState = !demoMode && !actualConnected && !isLoading && !error;

  return (
    <div className="space-y-6 pb-2">
      <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-[#2B2B2B] flex items-center gap-2 md:gap-3">
            <Wrench className="h-6 md:h-7 w-6 md:w-7 text-[#0D3B8E] flex-shrink-0" />
            Data Tools
          </h2>
          <p className="text-[#6B7280] mt-1 text-sm line-clamp-2">
            Fetch and display available backend tools for data processing.
          </p>
        </div>
        <div className="flex items-center gap-2 sm:flex-shrink-0">
          {demoMode && <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">Demo Data</Badge>}
          {!demoMode && actualConnected && <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">Connected</Badge>}
          {!demoMode && !actualConnected && <Badge variant="secondary" className="bg-[#EEF2F7] text-[#6B7280]">No Data Source</Badge>}
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
        <Card className="border-[#E5E7EB] bg-white">
          <AwaitingBackendState />
        </Card>
      ) : (
        <>
          {isLoading ? (
            <Card className="border-[#E5E7EB] bg-white p-8">
              <div className="flex flex-col items-center justify-center gap-4 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#0D3B8E]" />
                <div>
                  <h3 className="text-lg font-semibold text-[#2B2B2B]">Loading tools...</h3>
                  <p className="text-sm text-[#6B7280]">Fetching available tools from the backend.</p>
                </div>
              </div>
            </Card>
          ) : error ? (
            <Card className="border-[#E5E7EB] bg-white p-8">
              <div className="space-y-4 text-center">
                <h3 className="text-lg font-semibold text-[#2B2B2B]">Unable to load tools</h3>
                <p className="text-sm text-[#6B7280]">{error}</p>
                <Link href="/settings">
                  <Button variant="outline">Check backend configuration</Button>
                </Link>
              </div>
            </Card>
          ) : tools.length === 0 ? (
            <Card className="border-[#E5E7EB] bg-white p-8">
              <div className="space-y-3 text-center">
                <h3 className="text-lg font-semibold text-[#2B2B2B]">No tools available</h3>
                <p className="text-sm text-[#6B7280]">
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
                    "border-[#E5E7EB] bg-white cursor-pointer transition-all hover:border-primary/50 hover:shadow-md p-3 gap-2",
                    selectedTool === String(tool.id) ? "border-primary ring-1 ring-[#0D3B8E]" : ""
                  )}
                  onClick={() => setSelectedTool(String(tool.id))}
                >
                  <CardHeader className="p-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-[#0D3B8E]/10 flex-shrink-0">
                          <tool.icon className="h-4 w-4 text-[#0D3B8E]" />
                        </div>
                        <div>
                          <CardTitle className="text-sm text-[#2B2B2B] leading-snug">{tool.name}</CardTitle>
                          <div className="text-xs text-[#6B7280]">{tool.category}</div>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs flex-shrink-0">
                        {tool.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <p className="text-xs text-[#6B7280] mb-2 line-clamp-2">{tool.description}</p>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-[#6B7280]">
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
                          if (tool.isSafe) openRunDialog(tool);
                        }}
                        disabled={!tool.isSafe || runningTool === String(tool.id)}
                        title={!tool.isSafe ? "This tool is marked unsafe and can't be run directly." : undefined}
                      >
                        {runningTool === String(tool.id) ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            <Play className="h-3 w-3 mr-1" />
                            Run
                          </>
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

      {/* ===== My Custom Tools ===== */}
      {!demoMode && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold text-[#2B2B2B]">My Custom Tools</h3>
              <p className="text-sm text-[#6B7280]">Webhook or LLM-prompt tools you've defined yourself.</p>
            </div>
            <Button size="sm" onClick={() => { setEditingTool(null); setBuilderOpen(true); }}>
              <Plus className="h-4 w-4 mr-1.5" />
              New Tool
            </Button>
          </div>

          {isLoadingCustom ? (
            <Card className="border-[#E5E7EB] bg-white p-8">
              <div className="flex items-center justify-center gap-3 text-[#6B7280]">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading custom tools...
              </div>
            </Card>
          ) : customToolsError ? (
            <Card className="border-[#E5E7EB] bg-white p-6">
              <p className="text-sm text-[#6B7280]">{customToolsError}</p>
            </Card>
          ) : customTools.length === 0 ? (
            <Card className="border-[#E5E7EB] bg-white p-8">
              <div className="space-y-3 text-center">
                <h4 className="text-sm font-semibold text-[#2B2B2B]">You haven't created any custom tools yet</h4>
                <Button size="sm" variant="outline" onClick={() => { setEditingTool(null); setBuilderOpen(true); }}>
                  <Plus className="h-4 w-4 mr-1.5" />
                  New Tool
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {customTools.map((tool) => (
                <Card key={tool.id} className="border-[#E5E7EB] bg-white p-3 gap-2">
                  <CardHeader className="p-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-sm text-[#2B2B2B] leading-snug">{tool.display_name}</CardTitle>
                        <div className="text-xs text-[#6B7280]">{tool.category_display} &middot; {tool.tool_type_display}</div>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <Badge variant="secondary" className="text-xs">{tool.enabled ? "enabled" : "disabled"}</Badge>
                        {!tool.is_safe && <Badge variant="outline" className="text-[10px] text-[#6B7280]">Unsafe</Badge>}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0 space-y-3">
                    <p className="text-xs text-[#6B7280] line-clamp-2">{tool.description}</p>
                    <div className="flex items-center gap-1.5">
                      <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={() => openTestDialog(tool)}>
                        <FlaskConical className="h-3 w-3 mr-1" />
                        Test
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs px-2"
                        onClick={() => { setEditingTool(tool); setBuilderOpen(true); }}
                      >
                        <Pencil className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs px-2 text-destructive hover:text-destructive"
                        onClick={() => setDeletingTool(tool)}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      <Dialog
        open={!!runDialogTool}
        onOpenChange={(open) => { if (!open) setRunDialogTool(null); }}
      >
        <DialogContent className="sm:max-w-lg">
          {runDialogTool && (() => {
            const properties = runDialogTool.parametersSchema?.properties || {};
            const required = runDialogTool.parametersSchema?.required || [];
            const missingRequired = missingRequiredArgs(required, runArgs);
            const isRunning = runningTool === String(runDialogTool.id);

            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <runDialogTool.icon className="h-4 w-4 text-[#0D3B8E]" />
                    Run {runDialogTool.name}
                  </DialogTitle>
                  <DialogDescription>{runDialogTool.description}</DialogDescription>
                </DialogHeader>

                <ScrollArea className="max-h-[45vh] pr-3">
                  <ToolRunForm
                    properties={properties}
                    required={required}
                    args={runArgs}
                    onArgChange={(key, v) => setRunArgs((prev) => ({ ...prev, [key]: v }))}
                    result={runResult}
                    error={runError}
                  />
                </ScrollArea>

                <DialogFooter className="gap-2 sm:gap-2">
                  <Button variant="outline" onClick={() => setRunDialogTool(null)}>
                    Close
                  </Button>
                  <Button
                    onClick={() => runTool(runDialogTool, runArgs)}
                    disabled={isRunning || missingRequired.length > 0}
                    title={missingRequired.length > 0 ? `Missing required: ${missingRequired.join(", ")}` : undefined}
                  >
                    {isRunning ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    ) : (
                      <Play className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    Run
                  </Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Custom tool Test dialog — same schema-driven form as the built-in
          Run dialog above, pointed at POST tools/custom/<id>/test/. Unlike
          the Run button, this is never gated on is_safe: the backend
          explicitly bypasses that check because the user is testing their
          own tool. */}
      <Dialog
        open={!!testDialogTool}
        onOpenChange={(open) => { if (!open) setTestDialogTool(null); }}
      >
        <DialogContent className="sm:max-w-lg">
          {testDialogTool && (() => {
            const schema = testDialogTool.parameters_schema as JSONSchema | undefined;
            const properties = schema?.properties || {};
            const required = schema?.required || [];
            const missingRequired = missingRequiredArgs(required, testArgs);

            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <FlaskConical className="h-4 w-4 text-[#0D3B8E]" />
                    Test {testDialogTool.display_name}
                  </DialogTitle>
                  <DialogDescription>{testDialogTool.description}</DialogDescription>
                </DialogHeader>

                <ScrollArea className="max-h-[45vh] pr-3">
                  <ToolRunForm
                    properties={properties}
                    required={required}
                    args={testArgs}
                    onArgChange={(key, v) => setTestArgs((prev) => ({ ...prev, [key]: v }))}
                    result={testResult}
                    error={testError}
                  />
                </ScrollArea>

                <DialogFooter className="gap-2 sm:gap-2">
                  <Button variant="outline" onClick={() => setTestDialogTool(null)}>
                    Close
                  </Button>
                  <Button
                    onClick={() => testCustomTool(testDialogTool, testArgs)}
                    disabled={isTesting || missingRequired.length > 0}
                    title={missingRequired.length > 0 ? `Missing required: ${missingRequired.join(", ")}` : undefined}
                  >
                    {isTesting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    ) : (
                      <FlaskConical className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    Run Test
                  </Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      <CustomToolBuilderDialog
        open={builderOpen}
        onOpenChange={setBuilderOpen}
        initialTool={editingTool}
        onSaved={() => {
          loadCustomTools();
          toast.success(editingTool ? "Tool updated" : "Tool created");
        }}
      />

      <AlertDialog open={!!deletingTool} onOpenChange={(open) => { if (!open) setDeletingTool(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable Custom Tool</AlertDialogTitle>
            <AlertDialogDescription>
              This will disable {deletingTool?.display_name}; it can be re-enabled later via edit.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteCustomTool}
              disabled={isDeleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
              Disable
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
