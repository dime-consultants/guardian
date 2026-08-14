"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { type JSONSchemaProperty, renderSchemaInput } from "@/lib/json-schema-form";

interface ToolRunFormProps {
  properties: Record<string, JSONSchemaProperty>;
  required: string[];
  args: Record<string, unknown>;
  onArgChange: (key: string, value: unknown) => void;
  result?: any;
  error?: string | null;
  emptyLabel?: string;
}

/**
 * Shared schema-driven "fill in a tool's parameters, see the result" body —
 * previously duplicated near-identically between the built-in tool Run
 * dialog and the custom-tool Test dialog in tools-page.tsx. Callers own the
 * Dialog chrome (header/footer/submit button); this owns the form + result.
 */
export function ToolRunForm({ properties, required, args, onArgChange, result, error, emptyLabel }: ToolRunFormProps) {
  const entries = Object.entries(properties);

  return (
    <div className="space-y-4 py-1">
      {entries.length === 0 && (
        <p className="text-xs text-muted-foreground">{emptyLabel || "This tool takes no arguments."}</p>
      )}
      {entries.map(([key, schema]) => (
        <div key={key} className="space-y-1.5">
          <Label htmlFor={`arg-${key}`} className="text-xs font-medium">
            {key}
            {required.includes(key) && <span className="text-destructive"> *</span>}
          </Label>
          {renderSchemaInput(key, schema, args[key], (v) => onArgChange(key, v))}
          {schema.description && (
            <p className="text-xs text-muted-foreground">{schema.description}</p>
          )}
        </div>
      ))}

      {result && (
        <div
          className={cn(
            "rounded-lg border p-3 text-xs space-y-1.5 max-h-40 overflow-auto",
            result.ok === false
              ? "border-destructive/30 bg-destructive/5"
              : "border-green-500/30 bg-green-50 dark:bg-green-950/20",
          )}
        >
          <div className="flex items-center gap-1.5 font-medium">
            {result.ok === false ? (
              <XCircle className="h-3.5 w-3.5 text-destructive" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
            )}
            {result.ok === false ? "Failed" : "Result"}
          </div>
          <pre className="whitespace-pre-wrap break-words font-mono">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

/** Given a JSON Schema's required[] and the current args, returns the
 * required keys that are still unfilled. Shared missing-required check. */
export function missingRequiredArgs(required: string[], args: Record<string, unknown>): string[] {
  return required.filter((k) => {
    const v = args[k];
    return v === undefined || v === null || v === "";
  });
}
