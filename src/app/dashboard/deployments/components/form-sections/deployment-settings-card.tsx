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
import { Input } from "@/components/ui/input";
import { DeploymentEnvironment } from "@/store/features/deployments";
import { FormSectionProps } from "../types";

export function DeploymentSettingsCard({
  form,
  isLoading,
  success,
}: FormSectionProps) {
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
              <FormLabel>Branch</FormLabel>
              <FormControl>
                <Input {...field} disabled={isLoading || success} />
              </FormControl>
              <FormDescription>
                The Git branch to deploy (default: main)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}