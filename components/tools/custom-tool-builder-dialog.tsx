"use client";

import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useApp } from "@/contexts/app-context";
import type {
  CustomTool,
  CustomToolCategory,
  CustomToolCreatePayload,
  CustomToolType,
  CustomToolUpdatePayload,
} from "@/types/api";

const CATEGORY_OPTIONS: CustomToolCategory[] = [
  "extraction",
  "transformation",
  "reconciliation",
  "analysis",
  "report",
  "utility",
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTool?: CustomTool | null;
  onSaved: (tool: CustomTool) => void;
}

interface FormState {
  name: string;
  display_name: string;
  description: string;
  category: CustomToolCategory;
  tool_type: CustomToolType | "";
  is_safe: boolean;
  isSafeTouched: boolean;
  parametersSchemaText: string;
  webhook_url: string;
  webhook_method: "POST" | "GET";
  webhookHeadersText: string;
  webhook_timeout_seconds: string;
  system_prompt: string;
  outputSchemaText: string;
}

const emptyForm: FormState = {
  name: "",
  display_name: "",
  description: "",
  category: "utility",
  tool_type: "",
  is_safe: true,
  isSafeTouched: false,
  parametersSchemaText: "",
  webhook_url: "",
  webhook_method: "POST",
  webhookHeadersText: "",
  webhook_timeout_seconds: "30",
  system_prompt: "",
  outputSchemaText: "",
};

function toFormState(tool: CustomTool): FormState {
  return {
    name: tool.name,
    display_name: tool.display_name,
    description: tool.description,
    category: tool.category,
    tool_type: tool.tool_type,
    is_safe: tool.is_safe,
    isSafeTouched: true,
    parametersSchemaText: tool.parameters_schema && Object.keys(tool.parameters_schema).length
      ? JSON.stringify(tool.parameters_schema, null, 2)
      : "",
    webhook_url: tool.config?.webhook_url ?? "",
    webhook_method: tool.config?.webhook_method ?? "POST",
    webhookHeadersText: tool.config?.webhook_headers && Object.keys(tool.config.webhook_headers).length
      ? JSON.stringify(tool.config.webhook_headers, null, 2)
      : "",
    webhook_timeout_seconds: String(tool.config?.webhook_timeout_seconds ?? 30),
    system_prompt: tool.config?.system_prompt ?? "",
    outputSchemaText: tool.config?.output_schema
      ? JSON.stringify(tool.config.output_schema, null, 2)
      : "",
  };
}

/** Parses a JSON object textarea; returns undefined for blank input, or
 * throws a human-readable message for invalid/non-object JSON. */
function parseJsonObjectField(text: string, label: string): Record<string, unknown> | undefined {
  if (!text.trim()) return undefined;
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`${label} must be valid JSON.`);
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error(`${label} must be a JSON object.`);
  }
  return parsed as Record<string, unknown>;
}

export function CustomToolBuilderDialog({ open, onOpenChange, initialTool, onSaved }: Props) {
  const { apiFetch } = useApp();
  const isEdit = !!initialTool;
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(initialTool ? toFormState(initialTool) : emptyForm);
    setErrors({});
  }, [open, initialTool]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleToolTypeChange = (value: CustomToolType) => {
    setForm((prev) => ({
      ...prev,
      tool_type: value,
      // Mirror the backend default (is_safe = tool_type != "webhook") unless
      // the user has already explicitly touched the checkbox.
      is_safe: prev.isSafeTouched ? prev.is_safe : value !== "webhook",
    }));
  };

  const validate = (): { payload: CustomToolCreatePayload; fieldErrors: Record<string, string> } => {
    const fieldErrors: Record<string, string> = {};

    if (!isEdit && !/^[a-z][a-z0-9_]{1,79}$/.test(form.name)) {
      fieldErrors.name = "Must start with a lowercase letter and contain only lowercase letters, digits, and underscores (2-80 chars).";
    }
    if (!form.display_name.trim()) fieldErrors.display_name = "Display name is required.";
    if (!form.description.trim()) fieldErrors.description = "Description is required.";
    if (!form.tool_type) fieldErrors.tool_type = "Choose a tool type.";

    let parametersSchema: Record<string, unknown> | undefined;
    try {
      parametersSchema = parseJsonObjectField(form.parametersSchemaText, "Parameters schema");
      if (parametersSchema && parametersSchema.type !== "object") {
        fieldErrors.parametersSchemaText = 'Parameters schema must have "type": "object" at the top level.';
      }
    } catch (e) {
      fieldErrors.parametersSchemaText = e instanceof Error ? e.message : String(e);
    }

    let webhookHeaders: Record<string, unknown> | undefined;
    if (form.tool_type === "webhook") {
      if (!form.webhook_url.trim()) fieldErrors.webhook_url = "webhook_url is required for webhook tools.";
      const timeout = Number(form.webhook_timeout_seconds);
      if (!Number.isFinite(timeout) || timeout < 1 || timeout > 120) {
        fieldErrors.webhook_timeout_seconds = "Must be between 1 and 120 seconds.";
      }
      try {
        webhookHeaders = parseJsonObjectField(form.webhookHeadersText, "Webhook headers");
      } catch (e) {
        fieldErrors.webhookHeadersText = e instanceof Error ? e.message : String(e);
      }
    } else if (form.tool_type === "prompt_transform") {
      if (!form.system_prompt.trim()) fieldErrors.system_prompt = "system_prompt is required for prompt_transform tools.";
    }

    let outputSchema: Record<string, unknown> | undefined;
    try {
      outputSchema = parseJsonObjectField(form.outputSchemaText, "Output schema");
    } catch (e) {
      fieldErrors.outputSchemaText = e instanceof Error ? e.message : String(e);
    }

    const payload: CustomToolCreatePayload = {
      name: form.name,
      display_name: form.display_name,
      description: form.description,
      category: form.category,
      tool_type: (form.tool_type || "webhook") as CustomToolType,
      parameters_schema: parametersSchema,
      is_safe: form.is_safe,
    };
    if (form.tool_type === "webhook") {
      payload.webhook_url = form.webhook_url;
      payload.webhook_method = form.webhook_method;
      payload.webhook_headers = webhookHeaders as Record<string, string> | undefined;
      payload.webhook_timeout_seconds = Number(form.webhook_timeout_seconds);
    } else if (form.tool_type === "prompt_transform") {
      payload.system_prompt = form.system_prompt;
      payload.output_schema = outputSchema ?? null;
    }

    return { payload, fieldErrors };
  };

  const handleSubmit = async () => {
    if (!apiFetch) return;
    const { payload, fieldErrors } = validate();
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setIsSaving(true);
    try {
      const path = isEdit ? `tools/custom/${initialTool!.id}/` : "tools/custom/";
      const method = isEdit ? "PATCH" : "POST";
      const body: CustomToolCreatePayload | CustomToolUpdatePayload = isEdit
        ? (({ name, tool_type, ...rest }) => rest)(payload)
        : payload;

      const response = await apiFetch(path, { method, body });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const nextErrors: Record<string, string> = {};
        if (data && typeof data === "object") {
          for (const [key, value] of Object.entries(data)) {
            nextErrors[key] = Array.isArray(value) ? String(value[0]) : String(value);
          }
        }
        setErrors(Object.keys(nextErrors).length ? nextErrors : { _global: "Failed to save tool." });
        return;
      }

      onSaved(data as CustomTool);
      onOpenChange(false);
    } catch (e) {
      setErrors({ _global: e instanceof Error ? e.message : String(e) });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Edit ${initialTool?.display_name}` : "New Custom Tool"}</DialogTitle>
          <DialogDescription>
            Define a webhook or an LLM prompt-transform tool the assistant can call.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-3">
          <div className="space-y-4 py-1">
            {errors._global && <p className="text-xs text-destructive">{errors._global}</p>}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="ct-name" className="text-xs font-medium">Name (id) *</Label>
                <Input
                  id="ct-name"
                  value={form.name}
                  disabled={isEdit}
                  placeholder="my_custom_tool"
                  onChange={(e) => update("name", e.target.value)}
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ct-display-name" className="text-xs font-medium">Display Name *</Label>
                <Input
                  id="ct-display-name"
                  value={form.display_name}
                  onChange={(e) => update("display_name", e.target.value)}
                />
                {errors.display_name && <p className="text-xs text-destructive">{errors.display_name}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ct-description" className="text-xs font-medium">Description *</Label>
              <Textarea
                id="ct-description"
                rows={2}
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
              />
              {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Category</Label>
                <Select value={form.category} onValueChange={(v) => update("category", v as CustomToolCategory)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Tool Type *</Label>
                <Select
                  value={form.tool_type}
                  disabled={isEdit}
                  onValueChange={(v) => handleToolTypeChange(v as CustomToolType)}
                >
                  <SelectTrigger><SelectValue placeholder="Choose a type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="webhook">Webhook</SelectItem>
                    <SelectItem value="prompt_transform">Prompt Transform</SelectItem>
                  </SelectContent>
                </Select>
                {errors.tool_type && <p className="text-xs text-destructive">{errors.tool_type}</p>}
              </div>
            </div>

            {form.tool_type === "webhook" && (
              <div className="space-y-4 rounded-lg border p-3">
                <div className="space-y-1.5">
                  <Label htmlFor="ct-webhook-url" className="text-xs font-medium">Webhook URL *</Label>
                  <Input
                    id="ct-webhook-url"
                    value={form.webhook_url}
                    placeholder="https://example.com/hook"
                    onChange={(e) => update("webhook_url", e.target.value)}
                  />
                  {errors.webhook_url && <p className="text-xs text-destructive">{errors.webhook_url}</p>}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Method</Label>
                    <Select value={form.webhook_method} onValueChange={(v) => update("webhook_method", v as "POST" | "GET")}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="POST">POST</SelectItem>
                        <SelectItem value="GET">GET</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ct-timeout" className="text-xs font-medium">Timeout (seconds)</Label>
                    <Input
                      id="ct-timeout"
                      type="number"
                      value={form.webhook_timeout_seconds}
                      onChange={(e) => update("webhook_timeout_seconds", e.target.value)}
                    />
                    {errors.webhook_timeout_seconds && <p className="text-xs text-destructive">{errors.webhook_timeout_seconds}</p>}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ct-headers" className="text-xs font-medium">Headers (JSON, optional)</Label>
                  <Textarea
                    id="ct-headers"
                    rows={2}
                    className="font-mono text-xs"
                    placeholder='{"Authorization": "Bearer ..."}'
                    value={form.webhookHeadersText}
                    onChange={(e) => update("webhookHeadersText", e.target.value)}
                  />
                  {errors.webhookHeadersText && <p className="text-xs text-destructive">{errors.webhookHeadersText}</p>}
                </div>
              </div>
            )}

            {form.tool_type === "prompt_transform" && (
              <div className="space-y-4 rounded-lg border p-3">
                <div className="space-y-1.5">
                  <Label htmlFor="ct-system-prompt" className="text-xs font-medium">System Prompt *</Label>
                  <Textarea
                    id="ct-system-prompt"
                    rows={4}
                    value={form.system_prompt}
                    onChange={(e) => update("system_prompt", e.target.value)}
                  />
                  {errors.system_prompt && <p className="text-xs text-destructive">{errors.system_prompt}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ct-output-schema" className="text-xs font-medium">Output Schema (JSON, optional)</Label>
                  <Textarea
                    id="ct-output-schema"
                    rows={2}
                    className="font-mono text-xs"
                    placeholder='{"type": "object", "properties": {...}}'
                    value={form.outputSchemaText}
                    onChange={(e) => update("outputSchemaText", e.target.value)}
                  />
                  {errors.outputSchemaText && <p className="text-xs text-destructive">{errors.outputSchemaText}</p>}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="ct-params-schema" className="text-xs font-medium">Parameters Schema (JSON, optional)</Label>
              <Textarea
                id="ct-params-schema"
                rows={4}
                className="font-mono text-xs"
                placeholder='{"type": "object", "properties": {"file_id": {"type": "integer"}}, "required": ["file_id"]}'
                value={form.parametersSchemaText}
                onChange={(e) => update("parametersSchemaText", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Defines the arguments this tool accepts when the assistant (or Test) calls it.
              </p>
              {errors.parametersSchemaText && <p className="text-xs text-destructive">{errors.parametersSchemaText}</p>}
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="ct-is-safe"
                checked={form.is_safe}
                onCheckedChange={(v) => setForm((prev) => ({ ...prev, is_safe: !!v, isSafeTouched: true }))}
              />
              <Label htmlFor="ct-is-safe" className="text-xs font-normal text-muted-foreground">
                Safe to auto-invoke from chat (webhook tools default to unsafe)
              </Label>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
            {isEdit ? "Save Changes" : "Create Tool"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
