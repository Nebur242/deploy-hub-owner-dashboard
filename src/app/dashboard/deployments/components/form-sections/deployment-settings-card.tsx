"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { IconFlask, IconInfoCircle } from "@tabler/icons-react";
import { DeploymentEnvironment } from "@/store/features/deployments";
import { FormSectionProps } from "../types";


const versionRegex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/

export interface DeploymentSettingsCardProps extends FormSectionProps {
  projectVersions?: string[];
  isLoadingVersions?: boolean;
  isProjectOwner?: boolean; // Add flag to check if user is project owner
}

export function DeploymentSettingsCard({
  form,
  isLoading,
  success,
  projectVersions = ['main'],
  isLoadingVersions,
  isProjectOwner = false,
}: DeploymentSettingsCardProps) {
  const isTestMode = form.watch("is_test");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Deployment Settings</CardTitle>
        <CardDescription>
          Configure your deployment environment and version
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title (Optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="My Production Deployment"
                  disabled={isLoading || success}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                A friendly name to identify this deployment
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {isProjectOwner && (
          <>
            <FormField
              control={form.control}
              name="is_test"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-muted/50">
                  <div className="space-y-0.5">
                    <FormLabel className="flex items-center gap-2 text-base">
                      <IconFlask className="h-5 w-5 text-orange-500" />
                      Test Mode
                    </FormLabel>
                    <FormDescription>
                      Test your deployment configuration before making your project public. Test deployments don&apos;t consume license limits.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isLoading || success}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {isTestMode && (
              <Alert>
                <IconInfoCircle className="h-4 w-4" />
                <AlertDescription>
                  This is a <strong>test deployment</strong>. You can verify your configuration works correctly without affecting your production environment or consuming deployment limits.
                </AlertDescription>
              </Alert>
            )}
          </>
        )}

        <FormField
          control={form.control}
          name="environment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Environment</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isLoading || success}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select environment" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={DeploymentEnvironment.PRODUCTION}>
                    Production
                  </SelectItem>
                  <SelectItem value={DeploymentEnvironment.PREVIEW}>
                    Preview
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Production deployments are for your live site, while preview deployments are for testing.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="branch"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Branch/Version</FormLabel>
              <FormControl>
                {isLoadingVersions ? (
                  <Select disabled value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Loading versions..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="main">Loading...</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isLoading || success}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select branch or version" />
                    </SelectTrigger>
                    <SelectContent>
                      {projectVersions.map((version) => (
                        <SelectItem key={version} value={version}>
                          {versionRegex.test(version) ? `v${version}` : version}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </FormControl>
              <FormDescription>
                The Git branch or version tag to deploy
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}