// src/features/api/deploymentApiSlice.ts
import {
  EnvironmentVariable,
  Project,
  ProjectConfiguration,
} from "@/common/types";
import { axiosBaseQuery } from "@/config/api";
import { createSlice } from "@reduxjs/toolkit";
import { createApi } from "@reduxjs/toolkit/query/react";

export enum DeploymentStatus {
  PENDING = "pending",
  RUNNING = "running",
  SUCCESS = "success",
  FAILED = "failed",
  CANCELED = "canceled",
}

export enum DeploymentEnvironment {
  PRODUCTION = "production",
  PREVIEW = "preview",
}

export interface GitHubAccount {
  username: string;
  access_token: string;
  repository: string;
  workflow_file: string;
  available: boolean;
  failureCount: number;
  lastUsed?: Date;
}

export interface Deployment {
  id: string;
  owner_id: string;
  project_id: string;
  configuration_id: string;
  configuration: ProjectConfiguration;
  project: Project;
  environment: DeploymentEnvironment;
  branch: string;
  workflow_run_id?: string;
  status: DeploymentStatus;
  deployment_url?: string;
  environment_variables: EnvironmentVariable[];
  github_account?: GitHubAccount;
  error_message?: string;
  retry_count: number;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  is_test?: boolean; // Flag indicating if this is a test deployment
}

export interface CreateDeploymentRequest {
  environment: DeploymentEnvironment;
  branch: string;
  project_id: string;
  configuration_id: string;
  environment_variables: EnvironmentVariable[];
  is_test?: boolean; // Allow specifying test mode
}

export interface DeploymentLogs {
  logs: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: {
    totalItems: number;
    itemCount: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
  links: {
    first: string;
    previous: string;
    next: string;
    last: string;
  };
}

export interface DeploymentFilters {
  project_id: string;
  owner_id?: string;
  environment?: string;
  status?: DeploymentStatus;
  branch?: string;
  page?: number;
  limit?: number;
}

export interface DeploymentsState {
  loading: boolean;
  error: string;
  status: "pending" | "success" | "error";
  deployments: Deployment[];
}

export interface MonthlyDeploymentUsage {
  monthly: {
    used: number;
    limit: number;
    remaining: number;
    unlimited: boolean;
  };
  credits: {
    used: number;
    total: number;
    remaining: number;
    unlimited: boolean;
  };
}

const initialState: DeploymentsState = {
  loading: false,
  error: "",
  status: "pending",
  deployments: [],
};

export const deploymentApi = createApi({
  reducerPath: "deploymentApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["Deployment", "ProjectDeployments"],
  endpoints: (builder) => ({
    // Get deployments with pagination and filters
    getDeployments: builder.query<
      PaginatedResponse<Deployment>,
      DeploymentFilters
    >({
      query: (filters) => {
        const {
          project_id,
          owner_id,
          environment,
          status,
          branch,
          page = 1,
          limit = 10,
        } = filters;

        // Build query parameters
        const params = new URLSearchParams();
        params.append("page", page.toString());
        params.append("limit", limit.toString());

        // API expects snake_case 'project_id'
        if (project_id) params.append("project_id", project_id);

        // API expects snake_case 'owner_id'
        if (owner_id) params.append("owner_id", owner_id);
        if (environment) params.append("environment", environment);
        if (status) params.append("status", status);
        if (branch) params.append("branch", branch);

        return {
          url: `/deployments?${params.toString()}`,
          method: "GET",
        };
      },
      providesTags: (result) =>
        result
          ? [
              { type: "ProjectDeployments", id: result.items[0]?.project_id },
              ...result.items.map(({ id }) => ({
                type: "Deployment" as const,
                id,
              })),
            ]
          : ["ProjectDeployments"],
    }),

    // Get a single deployment
    getDeployment: builder.query<Deployment, string>({
      query: (deploymentId) => {
        return {
          method: "GET",
          url: `/deployments/${deploymentId}`,
        };
      },
      providesTags: (result, error, id) => [{ type: "Deployment", id }],
    }),

    // Create a new deployment
    createDeployment: builder.mutation<Deployment, CreateDeploymentRequest>({
      query: (deployment) => ({
        url: "/deployments",
        method: "POST",
        data: deployment,
      }),
      invalidatesTags: (result) => [
        { type: "ProjectDeployments", id: result?.project_id },
      ],
    }),

    // Retry a failed deployment
    retryDeployment: builder.mutation<Deployment, string>({
      query: (deploymentId) => ({
        url: `/deployments/${deploymentId}/retry`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Deployment", id },
        { type: "ProjectDeployments", id: result?.project_id },
      ],
    }),

    // Get deployment logs
    getDeploymentLogs: builder.query<DeploymentLogs, string>({
      query: (deploymentId) => {
        return {
          method: "GET",
          url: `/deployments/${deploymentId}/logs`,
        };
      },
    }),

    // Get monthly deployment usage
    getMonthlyUsage: builder.query<MonthlyDeploymentUsage, void>({
      query: () => ({
        method: "GET",
        url: "/deployments/monthly-usage",
      }),
    }),
  }),
});

export const {
  useGetDeploymentsQuery,
  useGetDeploymentQuery,
  useCreateDeploymentMutation,
  useRetryDeploymentMutation,
  useGetDeploymentLogsQuery,
  useGetMonthlyUsageQuery,
} = deploymentApi;

const deploymentsSlice = createSlice({
  name: "deployments",
  initialState,
  reducers: {},
  extraReducers: () => {
    // Add extra reducers here if needed
  },
});

const { reducer } = deploymentsSlice;
export default reducer;
