import { BaseEntity } from "./base";
import { DeploymentStatus } from "../enums/project";
import { Project, ProjectVersion } from "./project";
import { ProjectConfiguration, EnvironmentVariable } from "./configuration";
import { LicenseOption, UserLicense } from "./license";
import { User } from "./user";

// Deployment Environment enum
export enum DeploymentEnvironment {
  PRODUCTION = "production",
  PREVIEW = "preview",
}

// GitHub Account info used in deployment
export interface DeploymentGitHubAccount {
  username: string;
  access_token: string;
  repository: string;
  workflow_file: string;
  available: boolean;
  failure_count: number;
  last_used?: string;
}

// Webhook info for deployment
export interface DeploymentWebhookInfo {
  hook_id: number;
  repository_owner: string;
  repository_name: string;
}

// Environment variable value for deployment
export interface DeploymentEnvironmentVariable extends EnvironmentVariable {
  value?: string;
}

// Deployment entity - matches API entity
export interface Deployment extends BaseEntity {
  owner_id: string;
  owner?: User;
  project_id: string;
  project?: Project;
  license_id: string;
  license?: LicenseOption;
  user_license_id: string;
  user_license?: UserLicense;
  configuration_id: string;
  configuration?: ProjectConfiguration;
  environment: DeploymentEnvironment;
  branch: string;
  workflow_run_id?: string;
  site_id?: string;
  status: DeploymentStatus;
  deployment_url?: string;
  environment_variables: DeploymentEnvironmentVariable[];
  github_account?: DeploymentGitHubAccount;
  error_message?: string;
  retry_count: number;
  webhook_info?: DeploymentWebhookInfo;
  completed_at?: string;
  // Permission flags (inherited from license or all true for owner)
  can_submit_support_ticket: boolean;
  can_redeploy: boolean;
  can_update: boolean;
  has_priority_support: boolean;
  // Computed fields from API responses
  version?: ProjectVersion;
}
