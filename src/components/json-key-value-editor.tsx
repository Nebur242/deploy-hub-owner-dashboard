"use client";

import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

type JsonFieldType = "string" | "number" | "boolean";

interface JsonField {
  key: string;
  type: JsonFieldType;
  value: string;
}

interface JsonKeyValueEditorProps {
  /** The default JSON string (schema) from the configuration */
  defaultJson: string;
  /** Current value (JSON string) */
  value: string;
  /** Callback when value changes */
  onChange: (value: string) => void;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Variable key name for display */
  variableKey?: string;
  /** Whether the field has an error (e.g., required but empty) */
  hasError?: boolean;
}

/**
 * Parse JSON string to extract field structure
 */
function parseJsonToFields(jsonString: string): JsonField[] {
  if (!jsonString || jsonString.trim() === "") {
    return [];
  }

  try {
    const parsed = JSON.parse(jsonString);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return [];
    }

    return Object.entries(parsed).map(([key, value]) => {
      let type: JsonFieldType = "string";
      let fieldValue = String(value ?? "");

      if (typeof value === "number") {
        type = "number";
      } else if (typeof value === "boolean") {
        type = "boolean";
        fieldValue = String(value);
      }

      return { key, type, value: fieldValue };
    });
  } catch {
    return [];
  }
}

/**
 * Convert fields to JSON string
 */
function fieldsToJson(fields: JsonField[]): string {
  if (fields.length === 0) return "";

  const obj: Record<string, unknown> = {};
  fields.forEach((field) => {
    if (!field.key) return;

    switch (field.type) {
      case "number":
        obj[field.key] = field.value ? parseFloat(field.value) || 0 : 0;
        break;
      case "boolean":
        obj[field.key] = field.value === "true";
        break;
      default:
        obj[field.key] = field.value || "";
    }
  });

  return JSON.stringify(obj);
}

export function JsonKeyValueEditor({
  defaultJson,
  value,
  onChange,
  disabled = false,
  variableKey,
  hasError = false,
}: JsonKeyValueEditorProps) {
  // Parse the default JSON to get the schema
  const schemaFields = useMemo(() => parseJsonToFields(defaultJson), [defaultJson]);

  // Initialize fields from current value or default
  const [fields, setFields] = useState<JsonField[]>(() => {
    if (value && value.trim()) {
      return parseJsonToFields(value);
    }
    return schemaFields;
  });

  // Update fields when default JSON changes (new configuration selected)
  useEffect(() => {
    if (!value || value.trim() === "") {
      setFields(schemaFields);
    }
  }, [schemaFields, value]);

  // Update parent when fields change
  useEffect(() => {
    const json = fieldsToJson(fields);
    if (json !== value) {
      onChange(json);
    }
  }, [fields, onChange, value]);

  // Update a field value
  const updateFieldValue = (index: number, newValue: string) => {
    setFields(
      fields.map((field, i) =>
        i === index ? { ...field, value: newValue } : field
      )
    );
  };

  if (fields.length === 0) {
    return (
      <div className="text-center py-4 border border-dashed rounded-md">
        <p className="text-sm text-muted-foreground">
          No JSON fields configured
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {variableKey && (
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500">
            JSON
          </Badge>
          <span className="text-sm font-medium">{variableKey}</span>
        </div>
      )}

      <div className={`space-y-3 p-3 border rounded-md bg-muted/20 ${hasError ? 'border-red-500' : ''}`}>
        {fields.map((field, index) => (
          <div key={field.key} className="space-y-1">
            <Label className="text-sm flex items-center gap-2">
              <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                {field.key}
              </span>
              <Badge variant="secondary" className="text-xs font-normal">
                {field.type === "string"
                  ? "Text"
                  : field.type === "number"
                    ? "Number"
                    : "Yes/No"}
              </Badge>
            </Label>

            {field.type === "boolean" ? (
              <div className="flex items-center gap-3 py-1">
                <Switch
                  checked={field.value === "true"}
                  onCheckedChange={(checked) =>
                    updateFieldValue(index, String(checked))
                  }
                  disabled={disabled}
                />
                <span className="text-sm text-muted-foreground">
                  {field.value === "true" ? "Yes" : "No"}
                </span>
              </div>
            ) : (
              <Input
                type={field.type === "number" ? "number" : "text"}
                value={field.value}
                onChange={(e) => updateFieldValue(index, e.target.value)}
                placeholder={`Enter ${field.key}`}
                disabled={disabled}
                className="text-sm"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default JsonKeyValueEditor;
