import { z } from "zod";
import { DeploymentProvider } from "../enums/project";

// Environment variable schema
export const environmentVariableDtoSchema = z.object({
  key: z.string().min(1, "Key is required"),
  default_value: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  is_required: z.boolean(),
  is_secret: z.boolean(),
  video: z.string().url().optional().nullable(),
  type: z.enum(["text", "json"]),
});

// GitHub account schema
export const githubAccountDtoSchema = z.object({
  username: z.string().min(1, "GitHub username is required"),
  access_token: z.string().min(1, "Access token is required"),
  repository: z.string().min(1, "Repository name is required"),
  // must contain .yaml or .yml
  workflow_file: z
    .string()
    .min(1, "Workflow file name is required")
    .regex(/\.(yaml|yml)$/, "Workflow file must be a .yaml or .yml file"),
  default_branch: z.string().optional(),
});

// Deployment option schema
export const deploymentOptionDtoSchema = z.object({
  provider: z.nativeEnum(DeploymentProvider),
  environment_variables: z.array(environmentVariableDtoSchema),
});

// Schema for creating project configurations
export const createConfigurationDtoSchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(50, "Name must be less than 50 characters"),
  github_accounts: z.array(githubAccountDtoSchema),
  deployment_option: deploymentOptionDtoSchema,
});

// Schema for updating project configurations
export const updateConfigurationDtoSchema = z.object({
  id: z.string(),
  project_id: z.string(),
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(50, "Name must be less than 50 characters")
    .optional(),
  github_accounts: z.array(githubAccountDtoSchema).optional(),
  deployment_option: deploymentOptionDtoSchema.optional(),
});

// Type definitions from schemas
export type EnvironmentVariableDto = z.infer<
  typeof environmentVariableDtoSchema
>;
export type GithubAccountDto = z.infer<typeof githubAccountDtoSchema>;
export type DeploymentOptionDto = z.infer<typeof deploymentOptionDtoSchema>;
export type CreateConfigurationDto = z.infer<
  typeof createConfigurationDtoSchema
>;
export type UpdateConfigurationDto = z.infer<
  typeof updateConfigurationDtoSchema
>;
