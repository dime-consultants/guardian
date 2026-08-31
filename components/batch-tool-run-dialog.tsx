"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Play, CheckCircle2, XCircle, Download, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useApp } from "@/contexts/app-context";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { type JSONSchema, type JSONSchemaProperty, renderSchemaInput } from "@/lib/json-schema-form";
import { missingRequiredArgs } from "@/components/tool-run-form";

interface FileRef {
  id: string;
  name: string;
}

interface MergedTool {
  key: string; // tool_name — globally unique across built-ins and custom tools
  displayName: string;
  description: string;
  isCustom: boolean;
  customId?: string;
  parametersSchema: JSONSchema;
  fileSlotKeys: string[];
}

interface ResultEntry {
  status: "pending" | "success" | "error";
  result?: any;
  error?: string;
}

const FILE_PARAM_REGEX = /file_id|batch_id/i;

function toMergedTool(raw: any, isCustom: boolean): MergedTool | null {
  const schema: JSONSchema = isCustom ? raw.parameters_schema : raw.parameters_schema;
  const properties = schema?.properties || {};
  const fileSlotKeys = Object.keys(properties).filter((k) => FILE_PARAM_REGEX.test(k));
  // Tools with no file-reference param at all don't fit "run against
  // selected files" — they belong in the main Data Tools Run dialog instead.
  if (fileSlotKeys.length === 0 || fileSlotKeys.length > 2) return null;
  // summarise_batch takes batch_id, not a per-file id — selected files
  // don't reliably share a batch, so it's excluded from this flow.
  if (fileSlotKeys.some((k) => k.toLowerCase() === "batch_id")) return null;

  return {
    key: raw.name,
    displayName: raw.display_name || raw.name,
    description: raw.description || "",
    isCustom,
    customId: isCustom ? raw.id : undefined,
    parametersSchema: schema || {},
    fileSlotKeys,
  };
}

interface BatchToolRunDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  files: FileRef[];
  onToolRunComplete?: (fileIds: string[]) => void;
}

export function BatchToolRunDialog({ open, onOpenChange, files, onToolRunComplete }: BatchToolRunDialogProps) {
  const { apiFetch } = useApp();
  const [tools, setTools] = useState<MergedTool[]>([]);
  const [isLoadingTools, setIsLoadingTools] = useState(false);
  const [selectedToolKeys, setSelectedToolKeys] = useState<Set<string>>(new Set());
  const [sharedArgs, setSharedArgs] = useState<Record<string, unknown>>({});
  const [results, setResults] = useState<Map<string, ResultEntry>>(new Map());
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!open || !apiFetch) return;
    setSelectedToolKeys(new Set());
    setSharedArgs({});
    setResults(new Map());

    const load = async () => {
      setIsLoadingTools(true);
      try {
        const [builtinResp, customResp] = await Promise.all([
          apiFetch("tools/"),
          apiFetch("tools/custom/"),
        ]);
        const builtinPayload = await builtinResp.json().catch(() => null);
        const customPayload = await customResp.json().catch(() => null);

        const builtinList: any[] = Array.isArray(builtinPayload)
          ? builtinPayload
          : builtinPayload?.tools || builtinPayload?.results || [];
        const customList: any[] = Array.isArray(customPayload)
          ? customPayload
          : customPayload?.tools || customPayload?.results || [];

        const merged: MergedTool[] = [];
        for (const t of builtinList) {
          if (t.enabled === false || t.is_safe === false) continue;
          const m = toMergedTool(t, false);
          if (m) merged.push(m);
        }
        for (const t of customList) {
          if (t.enabled === false || t.is_safe === false) continue;
          const m = toMergedTool(t, true);
          if (m) merged.push(m);
        }
        setTools(merged);
      } catch (err) {
        console.error("Failed to load tools for batch run:", err);
        setTools([]);
      } finally {
        setIsLoadingTools(false);
      }
    };
    load();
  }, [open, apiFetch]);

  const selectedTools = tools.filter((t) => selectedToolKeys.has(t.key));

  // Union of every selected tool's non-file-slot properties, deduped by key
  // name — one shared parameter form instead of one per tool.
  const sharedProperties = useMemo(() => {
    const props: Record<string, JSONSchemaProperty> = {};
    for (const tool of selectedTools) {
      const all = tool.parametersSchema.properties || {};
      for (const [k, v] of Object.entries(all)) {
        if (!tool.fileSlotKeys.includes(k) && !(k in props)) props[k] = v;
      }
    }
    return props;
  }, [selectedTools]);

  const sharedRequired = useMemo(() => {
    const req = new Set<string>();
    for (const tool of selectedTools) {
      for (const k of tool.parametersSchema.required || []) {
        if (!tool.fileSlotKeys.includes(k)) req.add(k);
      }
    }
    return Array.from(req);
  }, [selectedTools]);

  const missingRequired = missingRequiredArgs(sharedRequired, sharedArgs);

  const toggleTool = (key: string) => {
    setSelectedToolKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const isToolSelectable = (tool: MergedTool) => {
    if (tool.fileSlotKeys.length === 2) return files.length === 2;
    return files.length >= 1;
  };

  const runBatch = async () => {
    if (!apiFetch || selectedTools.length === 0 || files.length === 0) return;
    setIsRunning(true);

    type Pair = { tool: MergedTool; fileLabel: string; arguments: Record<string, unknown> };
    const pairs: Pair[] = [];

    for (const tool of selectedTools) {
      if (tool.fileSlotKeys.length === 2) {
        if (files.length !== 2) continue;
        const [slotA, slotB] = [...tool.fileSlotKeys].sort();
        pairs.push({
          tool,
          fileLabel: `${files[0].name} + ${files[1].name}`,
          arguments: { ...sharedArgs, [slotA]: files[0].id, [slotB]: files[1].id },
        });
      } else {
        const slot = tool.fileSlotKeys[0];
        for (const file of files) {
          pairs.push({
            tool,
            fileLabel: file.name,
            arguments: { ...sharedArgs, [slot]: file.id },
          });
        }
      }
    }

    const initial = new Map<string, ResultEntry>();
    for (const p of pairs) initial.set(`${p.tool.key}:${p.fileLabel}`, { status: "pending" });
    setResults(initial);

    await Promise.allSettled(
      pairs.map(async (p) => {
        const key = `${p.tool.key}:${p.fileLabel}`;
        try {
          const path = p.tool.isCustom
            ? `tools/custom/${p.tool.customId}/test/`
            : "tools/run/";
          const body = p.tool.isCustom
            ? { arguments: p.arguments }
            : { tool_name: p.tool.key, arguments: p.arguments };
          const resp = await apiFetch!(path, { method: "POST", body });
          const data = await resp.json().catch(() => ({}));
          if (!resp.ok) {
            throw new Error(data?.error || data?.detail || `Request failed (${resp.status})`);
          }
          setResults((prev) => new Map(prev).set(key, { status: "success", result: data.result ?? data }));
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          setResults((prev) => new Map(prev).set(key, { status: "error", error: msg }));
        }
      }),
    );

    setIsRunning(false);
    toast.success("Batch run finished");
    onToolRunComplete?.(files.map((f) => f.id));
  };

  const downloadOutput = async (toolCallId: number, filenameHint: string) => {
    if (!apiFetch) return;
    try {
      const resp = await apiFetch(`tools/calls/${toolCallId}/output/download/`);
      if (!resp.ok) {
        toast.error("Download failed");
        return;
      }
      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filenameHint;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      toast.error("Download failed");
    }
  };

  const hasResults = results.size > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Run Tools on {files.length} File{files.length === 1 ? "" : "s"}</DialogTitle>
          <DialogDescription>
            Select one or more tools to run — parameters shared across tools are collected once.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[55vh] pr-3">
          <div className="space-y-4 py-1">
            {isLoadingTools ? (
              <div className="flex items-center justify-center py-6 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Loading tools...
              </div>
            ) : tools.length === 0 ? (
              <p className="text-xs text-muted-foreground">No file-processing tools are available.</p>
            ) : (
              <div className="space-y-2">
                {tools.map((tool) => {
                  const selectable = isToolSelectable(tool);
                  return (
                    <div
                      key={tool.key}
                      className={cn(
                        "flex items-start gap-2 rounded-lg border p-2.5",
                        !selectable && "opacity-50",
                      )}
                      title={
                        !selectable
                          ? tool.fileSlotKeys.length === 2
                            ? "Select exactly 2 files to use this tool"
                            : "Select at least 1 file"
                          : undefined
                      }
                    >
                      <Checkbox
                        id={`batch-tool-${tool.key}`}
                        checked={selectedToolKeys.has(tool.key)}
                        disabled={!selectable}
                        onCheckedChange={() => toggleTool(tool.key)}
                      />
                      <Label htmlFor={`batch-tool-${tool.key}`} className="flex-1 cursor-pointer">
                        <div className="text-sm font-medium">{tool.displayName}</div>
                        <div className="text-xs text-muted-foreground">{tool.description}</div>
                      </Label>
                    </div>
                  );
                })}
              </div>
            )}

            {Object.keys(sharedProperties).length > 0 && (
              <div className="space-y-3 rounded-lg border p-3">
                <p className="text-xs font-medium">Parameters</p>
                {Object.entries(sharedProperties).map(([key, schema]) => (
                  <div key={key} className="space-y-1.5">
                    <Label htmlFor={`arg-${key}`} className="text-xs font-medium">
                      {key}
                      {sharedRequired.includes(key) && <span className="text-destructive"> *</span>}
                    </Label>
                    {renderSchemaInput(key, schema, sharedArgs[key], (v) =>
                      setSharedArgs((prev) => ({ ...prev, [key]: v }))
                    )}
                    {schema.description && (
                      <p className="text-xs text-muted-foreground">{schema.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {hasResults && (
              <div className="space-y-2">
                <p className="text-xs font-medium">Results</p>
                {Array.from(results.entries()).map(([key, entry]) => {
                  const [toolKey, fileLabel] = key.split(":");
                  const tool = tools.find((t) => t.key === toolKey);
                  const outputFilename = entry.result?.output_filename;
                  const toolCallId = entry.result?.tool_call_id;
                  return (
                    <div key={key} className="flex items-center justify-between gap-2 rounded-lg border p-2.5 text-xs">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{tool?.displayName || toolKey}</div>
                        <div className="text-muted-foreground truncate">{fileLabel}</div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {entry.status === "pending" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        {entry.status === "success" && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                        )}
                        {entry.status === "error" && <XCircle className="h-3.5 w-3.5 text-destructive" />}
                        {entry.status === "success" && outputFilename && toolCallId && (
                          <Button
                            size="sm" variant="outline" className="h-6 px-2"
                            onClick={() => downloadOutput(toolCallId, `${tool?.displayName || "output"}.xlsx`)}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        )}
                        {entry.status === "success" && !outputFilename && (
                          <Button
                            size="sm" variant="outline" className="h-6 px-2"
                            onClick={() => toast.info("Result", { description: JSON.stringify(entry.result).slice(0, 300) })}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button
            onClick={runBatch}
            disabled={isRunning || selectedTools.length === 0 || missingRequired.length > 0}
            title={missingRequired.length > 0 ? `Missing required: ${missingRequired.join(", ")}` : undefined}
          >
            {isRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Play className="h-3.5 w-3.5 mr-1.5" />}
            Run {selectedTools.length > 0 ? `(${selectedTools.length})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
