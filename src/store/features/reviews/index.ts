import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "@/config/api";
import { Review, ReviewStatus, ApproveReviewDto } from "@/common/types/review";

// Response types matching the API
interface PaginatedReviewsResponse {
  items: Review[];
  meta: {
    totalItems?: number;
    itemCount: number;
    itemsPerPage: number;
    totalPages?: number;
    currentPage: number;
  };
  stats: {
    average_rating: number;
    rating_distribution: Record<number, number>;
  };
}

interface PendingCountResponse {
  pending_count: number;
}

// Define the Reviews API with RTK Query
export const reviewsApi = createApi({
  reducerPath: "reviewsApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["Review", "ProjectReviews", "OwnerReviews", "PendingCount"],
  endpoints: (builder) => ({
    // Get all reviews for owner's projects (includes pending/rejected)
    getOwnerReviews: builder.query<
      PaginatedReviewsResponse,
      { page?: number; limit?: number; status?: ReviewStatus }
    >({
      query: ({ page = 1, limit = 10, status }) => ({
        url: `/reviews/owner/my-reviews`,
        method: "GET",
        params: { page, limit, ...(status && { status }) },
      }),
      providesTags: (result) => [
        "OwnerReviews",
        ...(result?.items?.map((review) => ({
          type: "Review" as const,
          id: review.id,
        })) || []),
      ],
    }),

    // Get pending review count for owner
    getPendingReviewCount: builder.query<PendingCountResponse, void>({
      query: () => ({
        url: `/reviews/owner/pending-count`,
        method: "GET",
      }),
      providesTags: ["PendingCount"],
    }),

    // Approve or reject a review
    approveReview: builder.mutation<
      Review,
      { reviewId: string; data: ApproveReviewDto }
    >({
      query: ({ reviewId, data }) => ({
        url: `/reviews/${reviewId}/approve`,
        method: "PATCH",
        data,
      }),
      invalidatesTags: (result, error, { reviewId }) => [
        { type: "Review", id: reviewId },
        "OwnerReviews",
        "PendingCount",
      ],
    }),

    // Get reviews for a project with pagination (for owner to view reviews on their projects)
    getProjectReviews: builder.query<
      PaginatedReviewsResponse,
      { projectId: string; page?: number; limit?: number }
    >({
      query: ({ projectId, page = 1, limit = 10 }) => ({
        url: `/reviews/project/${projectId}`,
        method: "GET",
        params: { page, limit },
      }),
      providesTags: (result, error, { projectId }) => [
        { type: "ProjectReviews", id: projectId },
        ...(result?.items?.map((review) => ({
          type: "Review" as const,
          id: review.id,
        })) || []),
      ],
    }),
  }),
});

// Export hooks for usage in components
export const {
  useGetOwnerReviewsQuery,
  useGetPendingReviewCountQuery,
  useApproveReviewMutation,
  useGetProjectReviewsQuery,
} = reviewsApi;
