import { z } from "zod";
import { DeploymentEnvironment } from "@/store/features/deployments";
import { environmentVariableDtoSchema } from "@/common/dtos";

// Schema for creating a new deployment
export const deploymentSchema = z.object({
  project_id: z.string().min(1, { message: "Project is required" }),
  configuration_id: z.string().min(1, { message: "Configuration is required" }),
  environment: z.enum([
    DeploymentEnvironment.PRODUCTION,
    DeploymentEnvironment.PREVIEW
  ]),
  branch: z.string().min(1, { message: "Branch is required" }),
  environment_variables: z.array(environmentVariableDtoSchema).default([]),
});

// Schema for updating an existing deployment
export const deploymentUpdateSchema = deploymentSchema.partial();