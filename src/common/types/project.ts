import { Category } from "./category";

export enum TechStack {
  REACT = "react",
  NEXTJS = "nextjs",
  //   VUE = "vue",
  //   ANGULAR = "angular",
  //   NODE = "node",
  //   NESTJS = "nestjs",
  //   DJANGO = "django",
  //   FLASK = "flask",
  //   LARAVEL = "laravel",
  //   OTHER = "other",
}

export enum Visibility {
  PUBLIC = "public",
  PRIVATE = "private",
  FEATURED = "featured",
}

export enum DeploymentStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  SUCCESS = "success",
  FAILED = "failed",
  CANCELLED = "cancelled",
}

export enum DeploymentProvider {
  NETLIFY = "netlify",
  VERCEL = "vercel",
  // AWS = "aws",
  // GCP = "gcp",
  // AZURE = "azure",
  // GITHUB_PAGES = "github_pages",
}

export enum Currency {
  USD = "USD",
  EUR = "EUR",
}

export enum PurchaseStatus {
  PENDING = "pending",
  PAID = "paid",
  FAILED = "failed",
  REFUNDED = "refunded",
  EXPIRED = "expired",
}

export interface Project {
  id: string;
  name: string;
  description: string;
  slug: string;
  ownerId: string;
  repository: string;
  techStack: TechStack[];
  visibility: Visibility;
  categories: Category[];
  versions?: ProjectVersion[];
  configurations?: ProjectConfiguration[];
  licenses?: LicenseOption[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectVersion {
  id: string;
  projectId: string;
  version: string;
  releaseNotes: string;
  commitHash?: string;
  isLatest: boolean;
  isStable: boolean;
  createdAt: string;
  project: Project;
}

export interface GithubAccount {
  username: string;
  accessToken: string;
  repository: string;
  workflowFile: string;
}

export interface DeploymentOption {
  provider: DeploymentProvider;
  environmentVariables: EnvironmentVariable[];
}

export interface EnvironmentVariable {
  key: string;
  defaultValue: string;
  description: string;
  isRequired: boolean;
  isSecret: boolean;
  video: string;
}

export interface ProjectConfiguration {
  id: string;
  projectId: string;
  githubAccounts: GithubAccount[];
  deploymentOption: DeploymentOption;
  project: Project;
}

export interface LicenseOption {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: Currency;
  deploymentLimit: number;
  duration: number; // in days, 0 for unlimited
  features: string[];
  projects: Project[]; // Multiple projects can be associated with a license
}

export interface LicensePurchase {
  id: string;
  userId: string;
  projectId: string;
  licenseId: string;
  transactionId?: string;
  status: PurchaseStatus;
  amount: number;
  currency: string;
  deploymentsUsed: number;
  deploymentsAllowed: number;
  createdAt: string;
  expiresAt?: string;
  project?: Project;
  license?: LicenseOption;
}

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

export interface Deployment {
  id: string;
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
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  project?: Project;
  version?: ProjectVersion;
}

// Additional types for creating/updating entities

export interface CreateProjectConfigurationDto {
  githubAccounts: GithubAccount[];
  deploymentOption: DeploymentOption;
}

export interface CreateProjectDto {
  name: string;
  description: string;
  repository: string;
  techStack: TechStack[];
  visibility: Visibility;
  categories: { id: string }[];
}

export interface CreateVersionDto {
  version: string;
  releaseNotes?: string;
  commitHash?: string;
  isStable?: boolean;
}

export interface CreateLicenseDto {
  name: string;
  description: string;
  price: number;
  currency?: Currency;
  deploymentLimit?: number;
  duration?: number;
  features?: string[];
  projectIds: string[]; // IDs of projects to be associated with this license
}

export interface CreateDeploymentDto {
  projectId: string;
  versionId: string;
  licenseId: string;
  provider: DeploymentProvider;
  configuration: DeploymentConfiguration;
  environmentVariables?: Record<string, string>;
}
