"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
import { DeploymentEnvironment } from "@/store/features/deployments";
import { FormSectionProps } from "../types";


const versionRegex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/

export interface DeploymentSettingsCardProps extends FormSectionProps {
  projectVersions?: string[];
  isLoadingVersions?: boolean;
}

export function DeploymentSettingsCard({
  form,
  isLoading,
  success,
  projectVersions = ['main'],
  isLoadingVersions,
}: DeploymentSettingsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Deployment Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
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
                          {versionRegex.test(version) ? `v${version}` : "main"}
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