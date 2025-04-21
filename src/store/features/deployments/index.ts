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
  accessToken: string;
  repository: string;
  workflowFile: string;
  available: boolean;
  failureCount: number;
  lastUsed?: Date;
}

export interface Deployment {
  id: string;
  ownerId: string;
  projectId: string;
  configurationId: string;
  configuration: ProjectConfiguration;
  project: Project;
  environment: DeploymentEnvironment;
  branch: string;
  workflowRunId?: string;
  status: DeploymentStatus;
  deploymentUrl?: string;
  environmentVariables: EnvironmentVariable[];
  githubAccount?: GitHubAccount;
  errorMessage?: string;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface CreateDeploymentRequest {
  environment: DeploymentEnvironment;
  branch: string;
  projectId: string;
  configurationId: string;
  environmentVariables: EnvironmentVariable[];
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
  projectId: string;
  ownerId?: string;
  environment?: string;
  status?: DeploymentStatus;
  branch?: string;
  page?: number;
  limit?: number;
}

export interface DeployementsInitialState {
  loading: boolean;
  error: string;
  status: "pending" | "success" | "error";
  deployements: Deployment[];
}

const initialState: DeployementsInitialState = {
  loading: false,
  error: "",
  status: "pending",
  deployements: [],
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
          projectId,
          ownerId,
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

        if (projectId) params.append("projectId", projectId);

        if (ownerId) params.append("ownerId", ownerId);
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
              { type: "ProjectDeployments", id: result.items[0]?.projectId },
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
        { type: "ProjectDeployments", id: result?.projectId },
      ],
    }),

    // Retry a failed deployment
    retryDeployment: builder.mutation<Deployment, string>({
      query: (deploymentId) => ({
        url: `deployments/${deploymentId}/retry`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Deployment", id },
        { type: "ProjectDeployments", id: result?.projectId },
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
  }),
});

export const {
  useGetDeploymentsQuery,
  useGetDeploymentQuery,
  useCreateDeploymentMutation,
  useRetryDeploymentMutation,
  useGetDeploymentLogsQuery,
} = deploymentApi;

const deployementSlice = createSlice({
  name: "deployments",
  initialState,
  reducers: {},
  extraReducers: () => {
    // Add extra reducers here if needed
  },
});

const { reducer } = deployementSlice;
export default reducer;
