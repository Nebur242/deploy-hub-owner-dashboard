"use client";

import { useState } from "react";
import { IconPlus, IconTrash, IconEye, IconEyeOff } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface EnvironmentVariable {
  key: string;
  value: string;
}

interface EnvironmentVariablesProps {
  variables: EnvironmentVariable[];
  readOnly?: boolean;
  onChange?: (variables: EnvironmentVariable[]) => void;
}

export default function EnvironmentVariables({
  variables,
  readOnly = false,
  onChange,
}: EnvironmentVariablesProps) {
  const [localVariables, setLocalVariables] = useState<EnvironmentVariable[]>(variables);
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});

  // Add a new empty environment variable
  const addVariable = () => {
    const newVars = [...localVariables, { key: "", value: "" }];
    setLocalVariables(newVars);
    if (onChange) onChange(newVars);
  };

  // Remove an environment variable
  const removeVariable = (index: number) => {
    const newVars = localVariables.filter((_, i) => i !== index);
    setLocalVariables(newVars);
    if (onChange) onChange(newVars);
  };

  // Update a variable key or value
  const updateVariable = (index: number, field: "key" | "value", value: string) => {
    const newVars = [...localVariables];
    newVars[index][field] = value;
    setLocalVariables(newVars);
    if (onChange) onChange(newVars);
  };

  // Toggle showing/hiding a value
  const toggleShowValue = (index: number) => {
    const varKey = `var-${index}`;
    setShowValues(prev => ({
      ...prev,
      [varKey]: !prev[varKey]
    }));
  };

  if (readOnly) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Environment Variables</CardTitle>
        </CardHeader>
        <CardContent>
          {localVariables.length === 0 ? (
            <div className="text-muted-foreground text-sm">
              No environment variables defined.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {localVariables.map((variable, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <span className="font-mono text-sm">{variable.key}</span>
                  <Badge variant="outline">
                    ••••••••
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Environment Variables</CardTitle>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addVariable}
        >
          <IconPlus className="h-4 w-4 mr-1" /> Add Variable
        </Button>
      </CardHeader>
      <CardContent>
        {localVariables.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              No environment variables defined. Click &apos;Add Variable&apos; to create one.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {localVariables.map((variable, index) => (
              <div key={index} className="flex gap-3 items-center">
                <div className="w-1/3">
                  <Input
                    value={variable.key}
                    onChange={(e) => updateVariable(index, "key", e.target.value)}
                    placeholder="KEY"
                    className="uppercase"
                  />
                </div>
                <div className="flex-1 relative">
                  <Input
                    type={showValues[`var-${index}`] ? "text" : "password"}
                    value={variable.value}
                    onChange={(e) => updateVariable(index, "value", e.target.value)}
                    placeholder="value"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleShowValue(index)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  >
                    {showValues[`var-${index}`] ? (
                      <IconEyeOff className="h-4 w-4" />
                    ) : (
                      <IconEye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => removeVariable(index)}
                >
                  <IconTrash className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}