import { BaseEntity } from "./base";
import { DeploymentProvider } from "../enums/project";
import { Project } from "./project";

// GitHub Account entity
export interface GithubAccount {
  username: string;
  access_token: string;
  repository: string;
  workflow_file: string;
}

// Environment Variable entity
export interface EnvironmentVariable {
  key: string;
  default_value: string;
  description: string;
  is_required: boolean;
  is_secret: boolean;
  video: string | null;
  type: "text" | "json";
}

// Deployment Option entity
export interface DeploymentOption {
  provider: DeploymentProvider;
  environment_variables: EnvironmentVariable[];
}

// Project Configuration entity
export interface ProjectConfiguration extends BaseEntity {
  project_id: string;
  name: string;
  github_accounts: GithubAccount[];
  deployment_option: DeploymentOption;
  project: Project;
}
