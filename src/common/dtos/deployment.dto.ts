import { z } from "zod";
import { DeploymentProvider } from "../enums/project";

// Deployment configuration schema
export const deploymentConfigurationDtoSchema = z
  .object({
    site_id: z.string().optional(),
    team_id: z.string().optional(),
    project_name: z.string().optional(),
    install_command: z.string().optional(),
    build_command: z.string().optional(),
    publish_directory: z.string().optional(),
    repository: z.string(),
    username: z.string().optional(),
  })
  .catchall(z.unknown()); // For additional provider-specific fields

// Schema for creating a new deployment
export const createDeploymentDtoSchema = z.object({
  project_id: z.string(),
  version_id: z.string(),
  license_id: z.string(),
  provider: z.nativeEnum(DeploymentProvider),
  configuration: deploymentConfigurationDtoSchema,
  environment_variables: z.record(z.string(), z.string()).optional(),
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
