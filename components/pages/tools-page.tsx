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
  CheckCircle2,
  XCircle,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useApp } from "@/contexts/app-context";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface JSONSchemaProperty {
  type?: string;
  description?: string;
  enum?: (string | number)[];
  default?: unknown;
}

interface JSONSchema {
  type?: string;
  properties?: Record<string, JSONSchemaProperty>;
  required?: string[];
}

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

/**
 * Renders one form control for a tool's JSON Schema property — driven
 * entirely by what the backend's ToolDefinition.parameters_schema declares,
 * so new tools/parameters don't need frontend changes to become runnable.
 */
function renderSchemaInput(
  argKey: string,
  schema: JSONSchemaProperty,
  value: unknown,
  onChange: (v: unknown) => void,
) {
  const id = `arg-${argKey}`;

  if (schema.enum && schema.enum.length > 0) {
    return (
      <Select value={value != null ? String(value) : ""} onValueChange={onChange}>
        <SelectTrigger id={id}>
          <SelectValue placeholder={`Select ${argKey}`} />
        </SelectTrigger>
        <SelectContent>
          {schema.enum.map((opt) => (
            <SelectItem key={String(opt)} value={String(opt)}>{String(opt)}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (schema.type === "boolean") {
    return (
      <div className="flex items-center gap-2 h-9">
        <Checkbox id={id} checked={!!value} onCheckedChange={(v) => onChange(!!v)} />
        <Label htmlFor={id} className="text-xs font-normal text-muted-foreground">Enabled</Label>
      </div>
    );
  }

  if (schema.type === "integer" || schema.type === "number") {
    return (
      <Input
        id={id}
        type="number"
        value={value === undefined || value === null ? "" : String(value)}
        onChange={(e) => {
          const raw = e.target.value;
          onChange(raw === "" ? undefined : (schema.type === "integer" ? parseInt(raw, 10) : parseFloat(raw)));
        }}
      />
    );
  }

  if (schema.type === "object" || schema.type === "array") {
    return (
      <Textarea
        id={id}
        rows={3}
        placeholder="JSON"
        className="font-mono text-xs"
        value={value === undefined ? "" : JSON.stringify(value)}
        onChange={(e) => {
          const raw = e.target.value;
          if (!raw.trim()) { onChange(undefined); return; }
          try { onChange(JSON.parse(raw)); } catch { onChange(raw); }
        }}
      />
    );
  }

  return (
    <Input
      id={id}
      value={value === undefined || value === null ? "" : String(value)}
      onChange={(e) => onChange(e.target.value)}
    />
  );
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

      <Dialog
        open={!!runDialogTool}
        onOpenChange={(open) => { if (!open) setRunDialogTool(null); }}
      >
        <DialogContent className="sm:max-w-lg">
          {runDialogTool && (() => {
            const properties = runDialogTool.parametersSchema?.properties || {};
            const required = runDialogTool.parametersSchema?.required || [];
            const missingRequired = required.filter((k) => {
              const v = runArgs[k];
              return v === undefined || v === null || v === "";
            });
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
                  <div className="space-y-4 py-1">
                    {Object.entries(properties).map(([key, schema]) => (
                      <div key={key} className="space-y-1.5">
                        <Label htmlFor={`arg-${key}`} className="text-xs font-medium">
                          {key}
                          {required.includes(key) && <span className="text-destructive"> *</span>}
                        </Label>
                        {renderSchemaInput(key, schema, runArgs[key], (v) =>
                          setRunArgs((prev) => ({ ...prev, [key]: v }))
                        )}
                        {schema.description && (
                          <p className="text-xs text-muted-foreground">{schema.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {runResult && (
                  <div
                    className={cn(
                      "rounded-lg border p-3 text-xs space-y-1.5 max-h-40 overflow-auto",
                      runResult.ok === false
                        ? "border-destructive/30 bg-destructive/5"
                        : "border-green-500/30 bg-green-50 dark:bg-green-950/20",
                    )}
                  >
                    <div className="flex items-center gap-1.5 font-medium">
                      {runResult.ok === false ? (
                        <XCircle className="h-3.5 w-3.5 text-destructive" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                      )}
                      {runResult.ok === false ? "Failed" : "Result"}
                    </div>
                    <pre className="whitespace-pre-wrap break-words font-mono">
                      {JSON.stringify(runResult, null, 2)}
                    </pre>
                  </div>
                )}
                {runError && <p className="text-xs text-destructive">{runError}</p>}

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
    </div>
  );
}
