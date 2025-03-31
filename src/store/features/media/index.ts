// services/mediaApi.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import {
  Media,
  MediaQueryParams,
  PaginatedResponse,
} from "@/common/types/media";
import { axiosBaseQuery } from "@/config/api";
import { PaginatedResponse as DefaultPaginatedResponse } from "@/common/type";

function buildMediaQueryString(params: MediaQueryParams): URLSearchParams {
  const queryString = new URLSearchParams();

  // Add number parameters
  if (params.page !== undefined) {
    queryString.append("page", params.page.toString());
  }

  if (params.limit !== undefined) {
    queryString.append("limit", params.limit.toString());
  }

  // Add string parameters
  if (params.sortBy) {
    queryString.append("sortBy", params.sortBy);
  }

  if (params.order) {
    queryString.append("order", params.order);
  }

  if (params.type) {
    queryString.append("type", params.type.toString());
  }

  if (params.ownerId) {
    queryString.append("ownerId", params.ownerId);
  }

  // Handle array of tags
  if (params.tags && params.tags.length > 0) {
    // Option 1: Append each tag separately (results in multiple "tags" parameters)
    // queryString.append("tags", JSON.stringify(params.tags));

    // Option 2: Join tags with comma (results in a single "tags" parameter)
    queryString.append("tags", params.tags.join(","));
  }

  // Handle boolean
  if (params.isPublic !== undefined) {
    queryString.append("isPublic", params.isPublic.toString());
  }

  if (params.search) {
    queryString.append("search", params.search);
  }

  return queryString;
}

export const mediaApi = createApi({
  reducerPath: "mediaApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["Media"],
  endpoints: (builder) => ({
    getMedia: builder.query<PaginatedResponse<Media>, MediaQueryParams>({
      query: (params) => {
        // Build query string from params
        const queryString = buildMediaQueryString(params).toString();

        return {
          url: `/media${queryString ? `?${queryString}` : ""}`,
          method: "GET",
        };
      },
      // Transform the response from nestjs-typeorm-paginate to match our expected PaginatedResponse format
      transformResponse: (response: DefaultPaginatedResponse<Media>) => {
        // nestjs-typeorm-paginate returns a response with the following structure:
        // {
        //   items: Media[], // The actual items
        //   meta: {
        //     itemCount: number, // Items on this page
        //     totalItems: number, // Total items across all pages
        //     itemsPerPage: number, // Page size
        //     totalPages: number, // Total number of pages
        //     currentPage: number, // Current page number (1-based)
        //   }
        // }

        return {
          data: response.items || [],
          meta: {
            total: response.meta?.totalItems || 0,
            page: response.meta?.currentPage || 1,
            limit: response.meta?.itemsPerPage || 10,
            totalPages: response.meta?.totalPages || 0,
          },
        };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: "Media" as const, id })),
              { type: "Media", id: "LIST" },
            ]
          : [{ type: "Media", id: "LIST" }],
    }),

    getMediaById: builder.query<Media, string>({
      query: (id) => ({ url: `/media/${id}`, method: "GET" }),
      providesTags: (result, error, id) => [{ type: "Media", id }],
    }),

    createMedia: builder.mutation<
      Media,
      Omit<Media, "id" | "createdAt" | "updatedAt">
    >({
      query: (media) => ({
        url: "/media",
        method: "POST",
        data: media,
      }),
      invalidatesTags: [{ type: "Media", id: "LIST" }],
    }),

    updateMedia: builder.mutation<Media, { id: string; data: Partial<Media> }>({
      query: ({ id, data }) => ({
        url: `/media/${id}`,
        method: "PATCH",
        data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Media", id },
        { type: "Media", id: "LIST" },
      ],
    }),

    deleteMedia: builder.mutation<void, string>({
      query: (id) => ({
        url: `/media/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Media", id },
        { type: "Media", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetMediaQuery,
  useGetMediaByIdQuery,
  useCreateMediaMutation,
  useUpdateMediaMutation,
  useDeleteMediaMutation,
} = mediaApi;
