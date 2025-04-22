import { UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { deploymentSchema, deploymentUpdateSchema } from "./deployment-schemas";
import {
  EnvironmentVariable,
  Project,
  ProjectConfiguration,
} from "@/common/types";

// Export types from schema for external use
export type DeploymentFormValues = z.infer<typeof deploymentSchema>;
export type DeploymentUpdateFormValues = z.infer<typeof deploymentUpdateSchema>;

// Props for the main DeploymentForm component
export interface DeploymentFormProps {
  isEditing: boolean;
  initialData?: DeploymentFormValues;
  onSubmit: (data: DeploymentFormValues) => Promise<void>;
  initialProjectId?: string;
  initialConfigurationId?: string;
  projects: Array<Project>;
  configurations: Array<ProjectConfiguration>;
  projectVersions?: string[];
  isLoading: boolean;
  isSuccess: boolean;
  error: { message: string } | null;
  onProjectChange?: (projectId: string) => void;
  onEnvVarChange?: (key: string, value: string) => void;
  envVarValues?: Record<string, string>;
  isLoadingVersions?: boolean;
}

// Common props for all form section components
export interface FormSectionProps {
  form: UseFormReturn<DeploymentFormValues>;
  isLoading: boolean;
  success: boolean;
  isEditing?: boolean;
  initialData?: DeploymentFormValues;
}

// For project details section
export interface ProjectDetailsSectionProps extends FormSectionProps {
  projects: Array<Project>;
  configurations: Array<{ id: string; name: string }>;
  initialProjectId?: string;
  initialConfigurationId?: string;
  onConfigChange?: (configId: string) => void;
  onProjectChange?: (projectId: string) => void;
}

// For environment variables section
export interface EnvironmentVariablesSectionProps extends FormSectionProps {
  configEnvVars: EnvironmentVariable[];
  envVarValues: Record<string, string>;
  onEnvVarChange: (key: string, value: string) => void;
  isLoadingConfig: boolean;
  configError: string | null;
}

// For action buttons section
export interface ActionSectionProps {
  handleDiscard: () => void;
  isLoading: boolean;
  success: boolean;
  isEditing: boolean;
}
