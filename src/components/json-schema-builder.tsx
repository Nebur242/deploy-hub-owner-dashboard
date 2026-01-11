"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IconPlus, IconTrash, IconGripVertical } from "@tabler/icons-react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

export type JsonFieldType = "string" | "number" | "boolean";

export interface JsonSchemaField {
  key: string;
  type: JsonFieldType;
  defaultValue: string;
  description?: string;
}

interface JsonSchemaBuilderProps {
  value: string; // JSON string
  onChange: (value: string) => void;
  disabled?: boolean;
  maxFields?: number;
}

/**
 * Parse JSON string to schema fields
 */
function parseJsonToSchema(jsonString: string): JsonSchemaField[] {
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
      let defaultValue = String(value ?? "");

      if (typeof value === "number") {
        type = "number";
      } else if (typeof value === "boolean") {
        type = "boolean";
        defaultValue = String(value);
      }

      return { key, type, defaultValue };
    });
  } catch {
    return [];
  }
}

/**
 * Convert schema fields to JSON string
 */
function schemaToJson(fields: JsonSchemaField[]): string {
  if (fields.length === 0) return "";

  const obj: Record<string, unknown> = {};
  fields.forEach((field) => {
    if (!field.key) return;

    switch (field.type) {
      case "number":
        obj[field.key] = field.defaultValue ? parseFloat(field.defaultValue) || 0 : 0;
        break;
      case "boolean":
        obj[field.key] = field.defaultValue === "true";
        break;
      default:
        obj[field.key] = field.defaultValue || "";
    }
  });

  return JSON.stringify(obj, null, 2);
}

export function JsonSchemaBuilder({
  value,
  onChange,
  disabled = false,
  maxFields = 10,
}: JsonSchemaBuilderProps) {
  const [fields, setFields] = useState<JsonSchemaField[]>(() =>
    parseJsonToSchema(value)
  );
  const [isInternalUpdate, setIsInternalUpdate] = useState(false);

  // Update parent when fields change (internal updates only)
  useEffect(() => {
    if (isInternalUpdate) {
      const json = schemaToJson(fields);
      onChange(json);
      setIsInternalUpdate(false);
    }
  }, [fields, onChange, isInternalUpdate]);

  // Sync fields when value changes externally (not from our own onChange)
  useEffect(() => {
    if (!isInternalUpdate) {
      const parsedFields = parseJsonToSchema(value);
      if (JSON.stringify(parsedFields) !== JSON.stringify(fields)) {
        setFields(parsedFields);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const addField = () => {
    if (fields.length >= maxFields) return;
    setIsInternalUpdate(true);
    setFields([...fields, { key: "", type: "string", defaultValue: "" }]);
  };

  const removeField = (index: number) => {
    setIsInternalUpdate(true);
    setFields(fields.filter((_, i) => i !== index));
  };

  const updateField = (index: number, updates: Partial<JsonSchemaField>) => {
    setIsInternalUpdate(true);
    setFields(
      fields.map((field, i) => (i === index ? { ...field, ...updates } : field))
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">JSON Schema Fields</Label>
        <span className="text-xs text-muted-foreground">
          {fields.length} / {maxFields} fields
        </span>
      </div>

      {fields.length === 0 ? (
        <div className="text-center py-4 border border-dashed rounded-md">
          <p className="text-sm text-muted-foreground mb-2">
            No fields defined yet
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addField}
            disabled={disabled}
          >
            <IconPlus className="h-4 w-4 mr-1" />
            Add First Field
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {fields.map((field, index) => (
            <Card key={index} className="bg-muted/30">
              <CardContent className="p-3">
                <div className="flex items-start gap-2">
                  <IconGripVertical className="h-5 w-5 text-muted-foreground mt-2 cursor-move shrink-0" />
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <Input
                      placeholder="Field name"
                      value={field.key}
                      onChange={(e) =>
                        updateField(index, { key: e.target.value.replace(/\s/g, "_") })
                      }
                      disabled={disabled}
                      className="text-sm"
                    />
                    <Select
                      value={field.type}
                      onValueChange={(v: JsonFieldType) =>
                        updateField(index, { type: v, defaultValue: "" })
                      }
                      disabled={disabled}
                    >
                      <SelectTrigger className="text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="string">Text</SelectItem>
                        <SelectItem value="number">Number</SelectItem>
                        <SelectItem value="boolean">Yes/No</SelectItem>
                      </SelectContent>
                    </Select>
                    {field.type === "boolean" ? (
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={field.defaultValue === "true"}
                          onCheckedChange={(checked) =>
                            updateField(index, { defaultValue: String(checked) })
                          }
                          disabled={disabled}
                        />
                        <span className="text-sm text-muted-foreground">
                          {field.defaultValue === "true" ? "Yes" : "No"}
                        </span>
                      </div>
                    ) : (
                      <Input
                        placeholder="Default value"
                        value={field.defaultValue}
                        onChange={(e) =>
                          updateField(index, { defaultValue: e.target.value })
                        }
                        type={field.type === "number" ? "number" : "text"}
                        disabled={disabled}
                        className="text-sm"
                      />
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeField(index)}
                    disabled={disabled}
                    className="shrink-0 h-9 w-9 text-destructive hover:text-destructive"
                  >
                    <IconTrash className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {fields.length > 0 && fields.length < maxFields && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addField}
          disabled={disabled}
          className="w-full"
        >
          <IconPlus className="h-4 w-4 mr-1" />
          Add Field
        </Button>
      )}

      {fields.length > 0 && (
        <div className="mt-3 p-3 bg-muted/50 rounded-md">
          <Label className="text-xs font-medium text-muted-foreground">
            Generated JSON Preview:
          </Label>
          <pre className="text-xs mt-1 font-mono overflow-x-auto whitespace-pre-wrap break-all">
            {schemaToJson(fields) || "{}"}
          </pre>
        </div>
      )}
    </div>
  );
}

export default JsonSchemaBuilder;
