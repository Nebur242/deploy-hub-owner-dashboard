// services/mediaApi.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import {
  Media,
  MediaQueryParams,
  PaginatedResponse,
} from "@/common/types/media";
import { axiosBaseQuery } from "@/config/api";
import { PaginatedResponse as DefaultPaginatedResponse } from "@/common/type";

export const mediaApi = createApi({
  reducerPath: "mediaApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["Media"],
  endpoints: (builder) => ({
    getMedia: builder.query<PaginatedResponse<Media>, MediaQueryParams>({
      query: (params) => {
        // Build query string from params
        const queryString = Object.entries(params)
          .filter(([, value]) => value !== undefined && value !== null)
          .map(([key, value]) => {
            if (Array.isArray(value)) {
              return value
                .map((v) => `${key}=${encodeURIComponent(v)}`)
                .join("&");
            }
            return `${key}=${encodeURIComponent(value)}`;
          })
          .join("&");

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
