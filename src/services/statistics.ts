import { AXIOS } from "@/config/api";
import {
  DashboardStats,
  DeploymentStats,
  DeploymentTrend,
  EnvironmentStats,
  LicenseStats,
  ProjectStats,
  StatsPeriod,
  UserStats,
} from "@/common/types/statistics";

const STATISTICS_URL = "/statistics";

export const statisticsService = {
  /**
   * Get comprehensive dashboard statistics
   */
  async getDashboardStats(period?: StatsPeriod): Promise<DashboardStats> {
    const params = period ? { period } : {};
    const response = await AXIOS.get<{ data: DashboardStats }>(
      `${STATISTICS_URL}/dashboard`,
      { params }
    );
    return response.data.data || response.data;
  },

  /**
   * Get deployment statistics
   */
  async getDeploymentStats(period?: StatsPeriod): Promise<DeploymentStats> {
    const params = period ? { period } : {};
    const response = await AXIOS.get<{ data: DeploymentStats }>(
      `${STATISTICS_URL}/deployments`,
      { params }
    );
    return response.data.data || response.data;
  },

  /**
   * Get deployment trends over time
   */
  async getDeploymentTrends(period?: StatsPeriod): Promise<DeploymentTrend[]> {
    const params = period ? { period } : {};
    const response = await AXIOS.get<{ data: DeploymentTrend[] }>(
      `${STATISTICS_URL}/deployments/trends`,
      { params }
    );
    return response.data.data || response.data;
  },

  /**
   * Get deployment stats by environment
   */
  async getEnvironmentStats(period?: StatsPeriod): Promise<EnvironmentStats[]> {
    const params = period ? { period } : {};
    const response = await AXIOS.get<{ data: EnvironmentStats[] }>(
      `${STATISTICS_URL}/deployments/environments`,
      { params }
    );
    return response.data.data || response.data;
  },

  /**
   * Get project statistics
   */
  async getProjectStats(period?: StatsPeriod): Promise<ProjectStats> {
    const params = period ? { period } : {};
    const response = await AXIOS.get<{ data: ProjectStats }>(
      `${STATISTICS_URL}/projects`,
      { params }
    );
    return response.data.data || response.data;
  },

  /**
   * Get statistics for a specific project
   */
  async getProjectDeploymentStats(
    projectId: string,
    period?: StatsPeriod
  ): Promise<{
    total: number;
    successful: number;
    failed: number;
    successRate: number;
    avgDurationSeconds: number;
  }> {
    const params = period ? { period } : {};
    const response = await AXIOS.get<{
      data: {
        total: number;
        successful: number;
        failed: number;
        successRate: number;
        avgDurationSeconds: number;
      };
    }>(`${STATISTICS_URL}/projects/${projectId}`, { params });
    return response.data.data || response.data;
  },

  /**
   * Get license sales statistics
   */
  async getLicenseStats(period?: StatsPeriod): Promise<LicenseStats> {
    const params = period ? { period } : {};
    const response = await AXIOS.get<{ data: LicenseStats }>(
      `${STATISTICS_URL}/licenses`,
      { params }
    );
    return response.data.data || response.data;
  },

  /**
   * Get user-specific statistics (for license buyers)
   */
  async getUserStats(): Promise<UserStats> {
    const response = await AXIOS.get<{ data: UserStats }>(
      `${STATISTICS_URL}/user`
    );
    return response.data.data || response.data;
  },
};
