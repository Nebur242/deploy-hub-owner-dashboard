import { BaseEntity } from "./base";
import { DeploymentProvider } from "../enums/project";
import { Project } from "./project";

// GitHub Account entity
export interface GithubAccount {
  username: string;
  accessToken: string;
  repository: string;
  workflowFile: string;
}

// Environment Variable entity
export interface EnvironmentVariable {
  key: string;
  defaultValue: string;
  description: string;
  isRequired: boolean;
  isSecret: boolean;
  video: string;
}

// Deployment Option entity
export interface DeploymentOption {
  provider: DeploymentProvider;
  environmentVariables: EnvironmentVariable[];
}

// Project Configuration entity
export interface ProjectConfiguration extends BaseEntity {
  projectId: string;
  githubAccounts: GithubAccount[];
  deploymentOption: DeploymentOption;
  project: Project;
}