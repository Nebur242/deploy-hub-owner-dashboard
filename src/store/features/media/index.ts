import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "@/config/api";
import { MediaQueryParamsDto } from "@/common/dtos";
import { Media, PaginatedResponse } from "@/common/types";

function buildMediaQueryString(params: MediaQueryParamsDto): URLSearchParams {
  const queryString = new URLSearchParams();

  // Add number parameters
  if (params.page) {
    queryString.append("page", params.page.toString());
  }

  if (params.limit) {
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
    getMedia: builder.query<PaginatedResponse<Media>, MediaQueryParamsDto>({
      query: (params) => {
        // Build query string from params
        const queryString = buildMediaQueryString(params).toString();

        return {
          url: `/media${queryString ? `?${queryString}` : ""}`,
          method: "GET",
        };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: "Media" as const, id })),
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
