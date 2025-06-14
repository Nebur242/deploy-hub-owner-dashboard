// src/services/api.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "@/config/api";
import {
  LicenseOption,
  LicensePurchase,
  PaginatedResponse,
} from "@/common/types";
import {
  LicenseSearchParams,
  LicensePurchaseSearchParams,
} from "@/common/dtos";

// Define base API with auth header
export const licensesApi = createApi({
  reducerPath: "licensesApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["License", "LicensePurchase"],
  endpoints: (builder) => ({
    // LICENSES
    getLicenses: builder.query<
      PaginatedResponse<LicenseOption>,
      LicenseSearchParams | undefined
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();

        if (params) {
          if (params.limit)
            queryParams.append("limit", params.limit.toString());
          if (params.page) queryParams.append("page", params.page.toString());
          if (params.search) queryParams.append("search", params.search);
          if (params.currency) queryParams.append("currency", params.currency);
          if (params.sortBy) queryParams.append("sortBy", params.sortBy);
          if (params.sortDirection)
            queryParams.append("sortDirection", params.sortDirection);
        }

        return {
          url: `licenses?${queryParams.toString()}`,
          method: "GET",
        };
      },
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
    getLicensePurchases: builder.query<
      PaginatedResponse<LicensePurchase>,
      LicensePurchaseSearchParams | undefined
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();

        if (params) {
          if (params.limit)
            queryParams.append("limit", params.limit.toString());
          if (params.page) queryParams.append("page", params.page.toString());
          if (params.search) queryParams.append("search", params.search);
          if (params.status) queryParams.append("status", params.status);
          if (params.licenseId)
            queryParams.append("licenseId", params.licenseId);
          if (params.projectId)
            queryParams.append("projectId", params.projectId);
          if (params.userId) queryParams.append("userId", params.userId);
          if (params.sortBy) queryParams.append("sortBy", params.sortBy);
          if (params.sortDirection)
            queryParams.append("sortDirection", params.sortDirection);
          if (params.startDate)
            queryParams.append("startDate", params.startDate);
          if (params.endDate) queryParams.append("endDate", params.endDate);
        }

        return {
          url: `licenses/purchases?${queryParams.toString()}`,
          method: "GET",
        };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({
                type: "LicensePurchase" as const,
                id,
              })),
              { type: "LicensePurchase", id: "LIST" },
            ]
          : [{ type: "LicensePurchase", id: "LIST" }],
    }),

    getLicensePurchase: builder.query<LicensePurchase, string>({
      query: (id) => ({
        url: `licenses/purchases/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [
        { type: "LicensePurchase", id },
        { type: "LicensePurchase", id: "LIST" },
      ],
    }),

    purchaseLicense: builder.mutation<LicensePurchase, { licenseId: string }>({
      query: (body) => ({
        url: `licenses/${body.licenseId}/purchase`,
        method: "POST",
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
  }),
});

// Export hooks for usage in components
export const {
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
} = licensesApi;
