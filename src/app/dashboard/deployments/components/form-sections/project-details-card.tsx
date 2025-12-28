"use client";

import { IconLoader } from "@tabler/icons-react";
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
import { ProjectDetailsSectionProps } from "../types";

export function ProjectDetailsCard({
  form,
  isLoading,
  success,
  projects,
  configurations,
  onConfigChange,
  onProjectChange
}: ProjectDetailsSectionProps) {
  const handleProjectChange = (value: string) => {
    // No need to set projectId value here since we're handling it directly in the onValueChange

    // When project changes, reset configuration with validation
    form.setValue("configuration_id", "", { shouldValidate: true, shouldDirty: true });

    // Call parent handler if provided
    if (onProjectChange) {
      onProjectChange(value);
    }
  };

  const handleConfigChange = (value: string) => {
    // No need to set configurationId value here since we're handling it directly in the onValueChange

    // Clear any validation errors for configuration_id when a value is selected
    if (value) {
      form.clearErrors("configuration_id");
    }

    if (onConfigChange) {
      onConfigChange(value);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <FormField
          control={form.control}
          name="project_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project</FormLabel>
              <Select
                onValueChange={(value) => {
                  // First update the form field directly to avoid re-renders
                  field.onChange(value);
                  // Then call the handler for additional logic
                  handleProjectChange(value);
                }}
                value={field.value}
                disabled={isLoading || success} // Removed the initialProjectId condition
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {!projects.some(p => !p.configurations?.length) ? null : (
                    <SelectItem value="info" disabled>
                      Only projects with configurations are listed
                    </SelectItem>
                  )}
                  {projects.length > 0 ? (
                    projects.filter(p => p.configurations && p.configurations?.length > 0).map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-projects" disabled>
                      No projects available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="configuration_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Configuration</FormLabel>
              <Select
                onValueChange={(value) => {
                  // Update the form field directly
                  field.onChange(value);
                  // Then call the handler
                  handleConfigChange(value);
                }}
                value={field.value}
                disabled={
                  isLoading ||
                  success ||
                  !form.watch("project_id")
                  // Removed the initialConfigurationId condition
                }
              >
                <FormControl>
                  <SelectTrigger>
                    {isLoading ? (
                      <span className="flex items-center text-muted-foreground">
                        <IconLoader className="h-4 w-4 mr-2 animate-spin" /> Loading...
                      </span>
                    ) : !field.value && !form.watch("project_id") ? (
                      <span className="text-muted-foreground">Select a project first</span>
                    ) : !configurations.length && form.watch("project_id") ? (
                      <span className="text-muted-foreground">No configurations available</span>
                    ) : (
                      <SelectValue placeholder="Select a configuration" />
                    )}
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {configurations.length > 0 ? (
                    configurations.map((config) => (
                      <SelectItem key={config.id} value={config.id}>
                        {config.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-configs" disabled>
                      {form.watch("project_id")
                        ? "No configurations for this project"
                        : "Select a project first"}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <FormDescription>
                Choose a deployment configuration for your project
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}