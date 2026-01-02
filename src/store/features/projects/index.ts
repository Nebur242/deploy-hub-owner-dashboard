// src/services/api.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "@/config/api";
import {
  Deployment,
  PaginatedResponse,
  Project,
  ProjectConfiguration,
  ProjectVersion,
} from "@/common/types";
import { CreateConfigurationDto, CreateProjectDto } from "@/common/dtos";

// Define search parameters
export interface ProjectSearchParams {
  page?: number;
  limit?: number;
  search?: string;
  tech_stack?: string;
  visibility?: string;
  categoryIds?: string[];
  sortBy?: string;
  sortDirection?: "ASC" | "DESC";
}

// Moderation types
export interface ModerationStats {
  pending: number;
  approved: number;
  rejected: number;
  draft: number;
  changes_pending: number;
}

export interface SubmitForReviewDto {
  message?: string;
}

export interface ModerationActionDto {
  status: "approved" | "rejected";
  note?: string;
}

export interface AdminProjectSearchParams extends ProjectSearchParams {
  moderationStatus?: string;
}

// Define base API with auth header
export const projectsApi = createApi({
  reducerPath: "projectsApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: [
    "Project",
    "ProjectVersion",
    "Configuration",
    "Deployment",
    "Category",
    "Moderation",
  ],
  endpoints: (builder) => ({
    // PROJECTS
    getProjects: builder.query<
      PaginatedResponse<Project>,
      ProjectSearchParams | void
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();

        if (params) {
          if (params.limit)
            queryParams.append("limit", params.limit.toString());
          if (params.page) queryParams.append("page", params.page.toString());
          if (params.search) queryParams.append("search", params.search);
          if (params.tech_stack)
            queryParams.append("tech_stack", params.tech_stack);
          if (params.visibility)
            queryParams.append("visibility", params.visibility);
        }

        return {
          url: `projects?${queryParams.toString()}`,
          method: "GET",
          //   params,
        };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({
                type: "Project" as const,
                id,
              })),
              { type: "Project", id: "LIST" },
            ]
          : [{ type: "Project", id: "LIST" }],
    }),

    getProject: builder.query<Project, string>({
      query: (id) => ({
        url: `projects/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "Project", id }],
    }),

    createProject: builder.mutation<Project, CreateProjectDto>({
      query: (data) => ({
        url: "projects",
        method: "POST",
        data,
      }),
      invalidatesTags: [{ type: "Project", id: "LIST" }],
    }),

    updateProject: builder.mutation<
      Project,
      { id: string; body: CreateProjectDto }
    >({
      query: ({ id, body: data }) => ({
        url: `projects/${id}`,
        method: "PATCH",
        data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Project", id },
        { type: "Project", id: "LIST" },
      ],
    }),

    deleteProject: builder.mutation<void, string>({
      query: (id) => ({
        url: `projects/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Project", id: "LIST" }],
    }),

    // PUBLIC PROJECTS
    getPublicProjects: builder.query<
      PaginatedResponse<Project>,
      ProjectSearchParams | void
    >({
      query: (params = {}) => ({
        url: "public/projects",
        method: "GET",
        params,
      }),
      providesTags: [{ type: "Project", id: "PUBLIC_LIST" }],
    }),

    getFeaturedProjects: builder.query<
      PaginatedResponse<Project>,
      ProjectSearchParams | void
    >({
      query: (params = {}) => ({
        url: "public/projects/featured",
        method: "GET",
        params,
      }),
      providesTags: [{ type: "Project", id: "FEATURED_LIST" }],
    }),

    // PROJECT VERSIONS
    getVersions: builder.query<ProjectVersion[], string>({
      query: (project_id) => ({
        url: `projects/${project_id}/versions`,
        method: "GET",
      }),
      providesTags: (result, error, project_id) => [
        { type: "ProjectVersion", id: project_id },
      ],
    }),

    getVersion: builder.query<
      ProjectVersion,
      { project_id: string; version_id: string }
    >({
      query: ({ project_id, version_id }) => ({
        url: `projects/${project_id}/versions/${version_id}`,
        method: "GET",
      }),
      providesTags: (result, error, { version_id }) => [
        { type: "ProjectVersion", id: version_id },
      ],
    }),

    createVersion: builder.mutation<
      ProjectVersion,
      { project_id: string; body: Partial<ProjectVersion> }
    >({
      query: ({ project_id, body }) => ({
        url: `projects/${project_id}/versions`,
        method: "POST",
        data: body,
      }),
      invalidatesTags: (result, error, { project_id }) => [
        { type: "ProjectVersion", id: project_id },
        { type: "Project", id: project_id },
      ],
    }),

    updateVersion: builder.mutation<
      ProjectVersion,
      {
        project_id: string;
        id: string;
        body: Pick<ProjectVersion, "commit_hash" | "release_notes">;
      }
    >({
      query: ({ project_id, body, id }) => ({
        url: `projects/${project_id}/versions/${id}`,
        method: "PATCH",
        data: body,
      }),
      invalidatesTags: (result, error, { project_id, id }) => [
        { type: "ProjectVersion", id },
        { type: "ProjectVersion", id: project_id },
      ],
    }),

    setVersionAsStable: builder.mutation<
      ProjectVersion,
      { project_id: string; version_id: string }
    >({
      query: ({ project_id, version_id }) => ({
        url: `projects/${project_id}/versions/${version_id}/set-stable`,
        method: "POST",
      }),
      invalidatesTags: (result, error, { project_id, version_id }) => [
        { type: "ProjectVersion", id: project_id },
        { type: "ProjectVersion", id: version_id },
      ],
    }),

    deleteVersion: builder.mutation<
      void,
      { project_id: string; version_id: string }
    >({
      query: ({ project_id, version_id }) => ({
        url: `projects/${project_id}/versions/${version_id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { project_id }) => [
        { type: "ProjectVersion", id: project_id },
      ],
    }),

    // PROJECT CONFIGURATIONS
    getConfigurations: builder.query<ProjectConfiguration[], string>({
      query: (projectId) => ({
        url: `projects/${projectId}/configurations`,
        method: "GET",
      }),
      providesTags: (result, error, projectId) => [
        { type: "Configuration", id: projectId },
      ],
    }),

    getConfiguration: builder.query<
      ProjectConfiguration,
      { projectId: string; configId: string }
    >({
      query: ({ projectId, configId }) => ({
        url: `projects/${projectId}/configurations/${configId}`,
        method: "GET",
      }),
      providesTags: (result, error, { configId }) => [
        { type: "Configuration", id: configId },
      ],
    }),

    createConfiguration: builder.mutation<
      ProjectConfiguration,
      { projectId: string; body: Partial<CreateConfigurationDto> }
    >({
      query: ({ projectId, body }) => ({
        url: `projects/${projectId}/configurations`,
        method: "POST",
        data: body,
      }),
      invalidatesTags: (result, error, { projectId }) => [
        { type: "Configuration", id: projectId },
        { type: "Project", id: projectId },
      ],
    }),

    updateConfiguration: builder.mutation<
      ProjectConfiguration,
      {
        projectId: string;
        configId: string;
        body: Partial<CreateConfigurationDto>;
      }
    >({
      query: ({ projectId, configId, body }) => ({
        url: `projects/${projectId}/configurations/${configId}`,
        method: "PATCH",
        data: body,
      }),
      invalidatesTags: (result, error, { projectId, configId }) => [
        { type: "Configuration", id: configId },
        { type: "Configuration", id: projectId },
      ],
    }),

    deleteConfiguration: builder.mutation<
      void,
      { projectId: string; configId: string }
    >({
      query: ({ projectId, configId }) => ({
        url: `projects/${projectId}/configurations/${configId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { projectId }) => [
        { type: "Configuration", id: projectId },
      ],
    }),

    // DEPLOYMENTS
    getDeployments: builder.query<Deployment[], void>({
      query: () => ({
        url: "deployments",
        method: "GET",
      }),
      providesTags: [{ type: "Deployment", id: "LIST" }],
    }),

    getDeployment: builder.query<Deployment, string>({
      query: (id) => ({
        url: `deployments/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "Deployment", id }],
    }),

    createDeployment: builder.mutation<Deployment, Partial<Deployment>>({
      query: (body) => ({
        url: "deployments",
        method: "POST",
        data: body,
      }),
      invalidatesTags: [{ type: "Deployment", id: "LIST" }],
    }),

    cancelDeployment: builder.mutation<Deployment, string>({
      query: (id) => ({
        url: `deployments/${id}/cancel`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Deployment", id },
        { type: "Deployment", id: "LIST" },
      ],
    }),

    // MODERATION (Owner)
    submitForReview: builder.mutation<
      Project,
      { projectId: string; body?: SubmitForReviewDto }
    >({
      query: ({ projectId, body }) => ({
        url: `projects/${projectId}/submit-for-review`,
        method: "POST",
        data: body || {},
      }),
      invalidatesTags: (result, error, { projectId }) => [
        { type: "Project", id: projectId },
        { type: "Project", id: "LIST" },
        { type: "Moderation", id: "STATS" },
        { type: "Moderation", id: "PENDING" },
      ],
    }),

    // ADMIN MODERATION
    getModerationStats: builder.query<ModerationStats, void>({
      query: () => ({
        url: "admin/projects/moderation/stats",
        method: "GET",
      }),
      providesTags: [{ type: "Moderation", id: "STATS" }],
    }),

    getPendingModeration: builder.query<
      PaginatedResponse<Project>,
      ProjectSearchParams | void
    >({
      query: (params = {}) => {
        const queryParams = new URLSearchParams();

        if (params) {
          if (params.limit)
            queryParams.append("limit", params.limit.toString());
          if (params.page) queryParams.append("page", params.page.toString());
          if (params.search) queryParams.append("search", params.search);
        }

        return {
          url: `admin/projects/moderation/pending?${queryParams.toString()}`,
          method: "GET",
        };
      },
      providesTags: [{ type: "Moderation", id: "PENDING" }],
    }),

    getAdminProjects: builder.query<
      PaginatedResponse<Project>,
      AdminProjectSearchParams | void
    >({
      query: (params = {}) => {
        const queryParams = new URLSearchParams();

        if (params) {
          if (params.limit)
            queryParams.append("limit", params.limit.toString());
          if (params.page) queryParams.append("page", params.page.toString());
          if (params.search) queryParams.append("search", params.search);
          if (params.moderationStatus)
            queryParams.append("moderationStatus", params.moderationStatus);
          if (params.visibility)
            queryParams.append("visibility", params.visibility);
        }

        return {
          url: `admin/projects?${queryParams.toString()}`,
          method: "GET",
        };
      },
      providesTags: [{ type: "Moderation", id: "ADMIN_LIST" }],
    }),

    moderateProject: builder.mutation<
      Project,
      { projectId: string; body: ModerationActionDto }
    >({
      query: ({ projectId, body }) => ({
        url: `admin/projects/${projectId}/moderate`,
        method: "POST",
        data: body,
      }),
      invalidatesTags: (result, error, { projectId }) => [
        { type: "Project", id: projectId },
        { type: "Project", id: "LIST" },
        { type: "Moderation", id: "STATS" },
        { type: "Moderation", id: "PENDING" },
        { type: "Moderation", id: "ADMIN_LIST" },
      ],
    }),

    // Pending changes moderation (for already approved projects with edits)
    getPendingChanges: builder.query<
      PaginatedResponse<Project>,
      ProjectSearchParams | void
    >({
      query: (params = {}) => {
        const queryParams = new URLSearchParams();

        if (params) {
          if (params.limit)
            queryParams.append("limit", params.limit.toString());
          if (params.page) queryParams.append("page", params.page.toString());
          if (params.search) queryParams.append("search", params.search);
        }

        return {
          url: `admin/projects/moderation/pending-changes?${queryParams.toString()}`,
          method: "GET",
        };
      },
      providesTags: [{ type: "Moderation", id: "PENDING_CHANGES" }],
    }),

    moderatePendingChanges: builder.mutation<
      Project,
      { projectId: string; body: ModerationActionDto }
    >({
      query: ({ projectId, body }) => ({
        url: `admin/projects/${projectId}/moderate-changes`,
        method: "POST",
        data: body,
      }),
      invalidatesTags: (result, error, { projectId }) => [
        { type: "Project", id: projectId },
        { type: "Project", id: "LIST" },
        { type: "Moderation", id: "STATS" },
        { type: "Moderation", id: "PENDING_CHANGES" },
        { type: "Moderation", id: "ADMIN_LIST" },
      ],
    }),
  }),
});

// Export hooks for usage in components
export const {
  // Projects
  useGetProjectsQuery,
  useGetProjectQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,

  // Public Projects
  useGetPublicProjectsQuery,
  useGetFeaturedProjectsQuery,

  // Project Versions
  useGetVersionsQuery,
  useGetVersionQuery,
  useCreateVersionMutation,
  useSetVersionAsStableMutation,
  useDeleteVersionMutation,
  useUpdateVersionMutation,

  // Project Configurations
  useGetConfigurationsQuery,
  useGetConfigurationQuery,
  useCreateConfigurationMutation,
  useUpdateConfigurationMutation,
  useDeleteConfigurationMutation,

  // Deployments
  useGetDeploymentsQuery,
  useGetDeploymentQuery,
  useCreateDeploymentMutation,
  useCancelDeploymentMutation,

  // Moderation (Owner)
  useSubmitForReviewMutation,

  // Admin Moderation
  useGetModerationStatsQuery,
  useGetPendingModerationQuery,
  useGetAdminProjectsQuery,
  useModerateProjectMutation,
  useGetPendingChangesQuery,
  useModeratePendingChangesMutation,
} = projectsApi;

// Additional alias for useGetVersionsQuery to make the intent clearer
