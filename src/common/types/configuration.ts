import { BaseEntity } from "./base";
import { DeploymentProvider } from "../enums/project";
import { Project } from "./project";

export type GithubConnectionMode = "github_app";

// GitHub Account entity
export interface GithubAccount {
  connection_mode: GithubConnectionMode;
  username: string;
  access_token?: string;
  repository: string;
  workflow_file: string;
  default_branch?: string;
  github_app_installation_id?: number;
  github_app_connection_token?: string;
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
  note?: string | null;
  github_accounts: GithubAccount[];
  deployment_option: DeploymentOption;
  project: Project;
}
