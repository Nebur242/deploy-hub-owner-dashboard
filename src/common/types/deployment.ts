import { BaseEntity } from "./base";
import { DeploymentProvider, DeploymentStatus } from "../enums/project";
import { Project } from "./project";
import { ProjectVersion } from "./project";

// Deployment Configuration entity
export interface DeploymentConfiguration {
  siteId?: string;
  teamId?: string;
  projectName?: string;
  installCommand?: string;
  buildCommand?: string;
  publishDirectory?: string;
  repository: string;
  username?: string;
  [key: string]: unknown; // For additional provider-specific fields
}

// Deployment entity
export interface Deployment extends BaseEntity {
  userId: string;
  projectId: string;
  versionId: string;
  licenseId: string;
  status: DeploymentStatus;
  provider: DeploymentProvider;
  configuration: DeploymentConfiguration;
  deploymentUrl?: string;
  githubWorkflowId?: string;
  logUrl?: string;
  logs?: string;
  errorMessage?: string;
  startedAt?: string;
  completedAt?: string;
  project?: Project;
  version?: ProjectVersion;
}