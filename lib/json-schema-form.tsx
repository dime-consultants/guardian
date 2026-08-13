import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

export interface JSONSchemaProperty {
  type?: string;
  description?: string;
  enum?: (string | number)[];
  default?: unknown;
}

export interface JSONSchema {
  type?: string;
  properties?: Record<string, JSONSchemaProperty>;
  required?: string[];
}

/**
 * Renders one form control for a JSON Schema property — driven entirely by
 * what the schema declares, so new tools/parameters don't need frontend
 * changes to become usable. Shared between the built-in-tool Run dialog and
 * the custom-tool builder/test dialogs.
 */
export function renderSchemaInput(
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
