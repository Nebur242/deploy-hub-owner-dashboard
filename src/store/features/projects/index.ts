// src/services/api.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import {
  Project,
  ProjectVersion,
  ProjectConfiguration,
  LicenseOption,
  Deployment,
  LicensePurchase,
  CreateProjectConfigurationDto,
} from "@/common/types/project";
import { axiosBaseQuery } from "@/config/api";
import { PaginatedResponse } from "@/common/type";
import { ProjectFormData } from "@/app/dashboard/projects/components/project-form";

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
    "License",
    "Deployment",
    "Category",
    "LicensePurchase",
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

    createProject: builder.mutation<Project, ProjectFormData>({
      query: (data) => ({
        url: "projects",
        method: "POST",
        data,
      }),
      invalidatesTags: [{ type: "Project", id: "LIST" }],
    }),

    updateProject: builder.mutation<
      Project,
      { id: string; body: ProjectFormData }
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
      { projectId: string; body: Partial<CreateProjectConfigurationDto> }
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
        body: Partial<CreateProjectConfigurationDto>;
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

    // LICENSES
    getLicenses: builder.query<
      PaginatedResponse<LicenseOption>,
      { page?: number; limit?: number } | void
    >({
      query: (params = {}) => ({
        url: "licenses",
        method: "GET",
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({
                type: "License" as const,
                id,
              })),
              { type: "License", id: "LIST" },
            ]
          : [{ type: "License", id: "LIST" }],
    }),

    getLicense: builder.query<LicenseOption, string>({
      query: (id) => ({
        url: `licenses/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "License", id }],
    }),

    createLicense: builder.mutation<LicenseOption, Partial<LicenseOption>>({
      query: (body) => ({
        url: "licenses",
        method: "POST",
        data: body,
      }),
      invalidatesTags: [{ type: "License", id: "LIST" }],
    }),

    updateLicense: builder.mutation<
      LicenseOption,
      { id: string; body: Partial<LicenseOption> }
    >({
      query: ({ id, body }) => ({
        url: `licenses/${id}`,
        method: "PATCH",
        data: body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "License", id },
        { type: "License", id: "LIST" },
      ],
    }),

    deleteLicense: builder.mutation<void, string>({
      query: (id) => ({
        url: `licenses/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "License", id: "LIST" }],
    }),

    // LICENSE PURCHASES
    getLicensePurchases: builder.query<LicensePurchase[], void>({
      query: () => ({
        url: "licenses/purchases",
        method: "GET",
      }),
      providesTags: [{ type: "LicensePurchase", id: "LIST" }],
    }),

    getLicensePurchase: builder.query<LicensePurchase, string>({
      query: (id) => ({
        url: `licenses/purchases/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "LicensePurchase", id }],
    }),

    purchaseLicense: builder.mutation<
      LicensePurchase,
      { projectId: string; licenseId: string }
    >({
      query: (body) => ({
        url: "licenses/purchases",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "LicensePurchase", id: "LIST" }],
    }),

    confirmPayment: builder.mutation<
      LicensePurchase,
      { purchaseId: string; transactionId: string }
    >({
      query: ({ purchaseId, transactionId }) => ({
        url: `licenses/purchases/${purchaseId}/confirm`,
        method: "POST",
        data: { transactionId },
      }),
      invalidatesTags: (result, error, { purchaseId }) => [
        { type: "LicensePurchase", id: purchaseId },
        { type: "LicensePurchase", id: "LIST" },
      ],
    }),

    cancelPurchase: builder.mutation<void, string>({
      query: (purchaseId) => ({
        url: `licenses/purchases/${purchaseId}/cancel`,
        method: "POST",
      }),
      invalidatesTags: (result, error, purchaseId) => [
        { type: "LicensePurchase", id: purchaseId },
        { type: "LicensePurchase", id: "LIST" },
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

  // Licenses
  useGetLicensesQuery,
  useGetLicenseQuery,
  useCreateLicenseMutation,
  useUpdateLicenseMutation,
  useDeleteLicenseMutation,

  // License Purchases
  useGetLicensePurchasesQuery,
  useGetLicensePurchaseQuery,
  usePurchaseLicenseMutation,
  useConfirmPaymentMutation,
  useCancelPurchaseMutation,

  // Deployments
  useGetDeploymentsQuery,
  useGetDeploymentQuery,
  useCreateDeploymentMutation,
  useCancelDeploymentMutation,
} = projectsApi;
