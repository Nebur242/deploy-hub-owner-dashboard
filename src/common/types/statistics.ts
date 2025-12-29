/**
 * Statistics period enum for filtering
 */
export enum StatsPeriod {
  TODAY = "today",
  WEEK = "week",
  MONTH = "month",
  YEAR = "year",
  ALL_TIME = "all_time",
}

/**
 * Query parameters for statistics endpoints
 */
export interface StatsQuery {
  period?: StatsPeriod;
}

/**
 * Deployment statistics
 */
export interface DeploymentStats {
  total: number;
  successful: number;
  failed: number;
  pending: number;
  running: number;
  canceled: number;
  successRate: number;
  avgDurationSeconds: number;
}

/**
 * Deployment trend data point
 */
export interface DeploymentTrend {
  date: string;
  count: number;
  successful: number;
  failed: number;
}

/**
 * Project statistics
 */
export interface ProjectStats {
  total: number;
  activeWithDeployments: number;
  topProjects: {
    projectId: string;
    projectName: string;
    deploymentCount: number;
    successCount: number;
  }[];
}

/**
 * License statistics
 */
export interface LicenseStats {
  totalSold: number;
  activeLicenses: number;
  totalRevenue: number;
  byProject: {
    projectId: string;
    projectName: string;
    licensesSold: number;
    revenue: number;
  }[];
}

/**
 * Environment statistics
 */
export interface EnvironmentStats {
  environment: string;
  count: number;
  successCount: number;
  successRate: number;
}

/**
 * Recent deployment activity item
 */
export interface RecentActivity {
  id: string;
  project_id: string;
  projectName?: string;
  environment: string;
  status: string;
  created_at: string;
  completed_at?: string;
}

/**
 * Dashboard statistics - comprehensive overview
 */
export interface DashboardStats {
  deployments: DeploymentStats;
  projects: ProjectStats;
  licenses: LicenseStats;
  deploymentTrends: DeploymentTrend[];
  recentActivity: RecentActivity[];
}

/**
 * User-specific statistics (for license buyers)
 */
export interface UserStats {
  deployments: DeploymentStats;
  activeLicenses: number;
  deploymentsRemaining: number;
}
