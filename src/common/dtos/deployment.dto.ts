import { z } from "zod";
import { DeploymentProvider } from "../enums/project";

// Deployment configuration schema
export const deploymentConfigurationDtoSchema = z
  .object({
    siteId: z.string().optional(),
    teamId: z.string().optional(),
    projectName: z.string().optional(),
    installCommand: z.string().optional(),
    buildCommand: z.string().optional(),
    publishDirectory: z.string().optional(),
    repository: z.string(),
    username: z.string().optional(),
  })
  .catchall(z.unknown()); // For additional provider-specific fields

// Schema for creating a new deployment
export const createDeploymentDtoSchema = z.object({
  projectId: z.string(),
  versionId: z.string(),
  licenseId: z.string(),
  provider: z.nativeEnum(DeploymentProvider),
  configuration: deploymentConfigurationDtoSchema,
  environmentVariables: z.record(z.string()).optional(),
});

// Schema for canceling a deployment
export const cancelDeploymentDtoSchema = z.object({
  id: z.string(),
});

// Type definitions from schemas
export type DeploymentConfigurationDto = z.infer<
  typeof deploymentConfigurationDtoSchema
>;
export type CreateDeploymentDto = z.infer<typeof createDeploymentDtoSchema>;
export type CancelDeploymentDto = z.infer<typeof cancelDeploymentDtoSchema>;
