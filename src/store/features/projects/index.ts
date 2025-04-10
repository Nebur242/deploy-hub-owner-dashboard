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
  techStack?: string;
  visibility?: string;
  categoryIds?: string[];
  sortBy?: string;
  sortDirection?: "ASC" | "DESC";
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
          if (params.techStack)
            queryParams.append("techStack", params.techStack);
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
      query: (projectId) => ({
        url: `projects/${projectId}/versions`,
        method: "GET",
      }),
      providesTags: (result, error, projectId) => [
        { type: "ProjectVersion", id: projectId },
      ],
    }),

    getVersion: builder.query<
      ProjectVersion,
      { projectId: string; versionId: string }
    >({
      query: ({ projectId, versionId }) => ({
        url: `projects/${projectId}/versions/${versionId}`,
        method: "GET",
      }),
      providesTags: (result, error, { versionId }) => [
        { type: "ProjectVersion", id: versionId },
      ],
    }),

    createVersion: builder.mutation<
      ProjectVersion,
      { projectId: string; body: Partial<ProjectVersion> }
    >({
      query: ({ projectId, body }) => ({
        url: `projects/${projectId}/versions`,
        method: "POST",
        data: body,
      }),
      invalidatesTags: (result, error, { projectId }) => [
        { type: "ProjectVersion", id: projectId },
        { type: "Project", id: projectId },
      ],
    }),

    updateVersion: builder.mutation<
      ProjectVersion,
      {
        projectId: string;
        id: string;
        body: Pick<ProjectVersion, "commitHash" | "releaseNotes">;
      }
    >({
      query: ({ projectId, body, id }) => ({
        url: `projects/${projectId}/versions/${id}`,
        method: "PATCH",
        data: body,
      }),
      invalidatesTags: (result, error, { projectId, id }) => [
        { type: "ProjectVersion", id },
        { type: "ProjectVersion", id: projectId },
      ],
    }),

    setVersionAsStable: builder.mutation<
      ProjectVersion,
      { projectId: string; versionId: string }
    >({
      query: ({ projectId, versionId }) => ({
        url: `projects/${projectId}/versions/${versionId}/set-stable`,
        method: "POST",
      }),
      invalidatesTags: (result, error, { projectId, versionId }) => [
        { type: "ProjectVersion", id: projectId },
        { type: "ProjectVersion", id: versionId },
      ],
    }),

    deleteVersion: builder.mutation<
      void,
      { projectId: string; versionId: string }
    >({
      query: ({ projectId, versionId }) => ({
        url: `projects/${projectId}/versions/${versionId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { projectId }) => [
        { type: "ProjectVersion", id: projectId },
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
} = projectsApi;
