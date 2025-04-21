"use client";

import { IconLoader, IconAlertCircle } from "@tabler/icons-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EnvironmentVariablesSectionProps } from "../types";

export function EnvVariablesCard({
  form,
  isLoading,
  success,
  configEnvVars,
  envVarValues,
  onEnvVarChange,
  isLoadingConfig,
  configError,
}: EnvironmentVariablesSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Environment Variables</CardTitle>
        <CardDescription>
          Environment variables from the selected configuration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoadingConfig ? (
          <div className="flex items-center justify-center py-6">
            <IconLoader className="h-6 w-6 animate-spin text-primary mr-2" />
            <span>Loading configuration details...</span>
          </div>
        ) : configError ? (
          <Alert variant="destructive">
            <IconAlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{configError}</AlertDescription>
          </Alert>
        ) : !form.getValues("configurationId") ? (
          <Alert>
            <IconAlertCircle className="h-4 w-4" />
            <AlertTitle>Required</AlertTitle>
            <AlertDescription>
              Please select a configuration to see the required environment variables.
            </AlertDescription>
          </Alert>
        ) : configEnvVars.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No environment variables found for this configuration.
          </div>
        ) : (
          <div className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {configEnvVars.map((envVar) => (
              <div key={envVar.key} className={`${envVar.isRequired ? 'block' : 'hidden'} p-4 border rounded-md`}>
                <div className="mb-2">
                  <span className="font-medium">{envVar.key}</span>
                  <p className="text-sm text-muted-foreground mt-1">{envVar.description}</p>
                </div>

                <Input
                  type={envVar.isSecret ? "password" : "text"}
                  placeholder={
                    envVar.isRequired
                      ? `Enter value for ${envVar.key} (required)`
                      : `Enter value for ${envVar.key} (default: ${envVar.defaultValue || "empty"})`
                  }
                  value={envVarValues[envVar.key] || ""}
                  onChange={(e) => onEnvVarChange(envVar.key, e.target.value)}
                  disabled={isLoading || success}

                />

                <div className="flex items-center gap-2 mt-3">
                  {envVar.isRequired && (
                    <Badge variant="outline" className="bg-red-500/10 text-red-500">Required</Badge>
                  )}
                  {envVar.isSecret && (
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-500">Secret</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <input type="hidden" {...form.register("environmentVariables")} />
      </CardContent>
    </Card>
  );
}