import { z } from "zod";
import { DeploymentProvider } from "../enums/project";

// Environment variable schema
export const environmentVariableDtoSchema = z.object({
  key: z.string().min(1, "Key is required"),
  defaultValue: z.string().optional(),
  description: z.string().optional(),
  isRequired: z.boolean().default(false),
  isSecret: z.boolean().default(false),
  video: z.string().url().optional().nullable(),
  type: z.enum(["text", "json"]).default("text"),
});

// GitHub account schema
export const githubAccountDtoSchema = z.object({
  username: z.string().min(1, "GitHub username is required"),
  accessToken: z.string().min(1, "Access token is required"),
  repository: z.string().min(1, "Repository name is required"),
  // must contain .yaml or .yml
  workflowFile: z
    .string()
    .min(1, "Workflow file name is required")
    .regex(/\.(yaml|yml)$/, "Workflow file must be a .yaml or .yml file"),
});

// Deployment option schema
export const deploymentOptionDtoSchema = z.object({
  provider: z.nativeEnum(DeploymentProvider),
  environmentVariables: z.array(environmentVariableDtoSchema).default([]),
});

// Schema for creating project configurations
export const createConfigurationDtoSchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(50, "Name must be less than 50 characters"),
  githubAccounts: z.array(githubAccountDtoSchema),
  deploymentOption: deploymentOptionDtoSchema,
});

// Schema for updating project configurations
export const updateConfigurationDtoSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(50, "Name must be less than 50 characters")
    .optional(),
  githubAccounts: z.array(githubAccountDtoSchema).optional(),
  deploymentOption: deploymentOptionDtoSchema.optional(),
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
