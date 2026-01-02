import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "@/config/api";

// Notification scope enum matching API
export enum NotificationScope {
  DEPLOYMENT = "DEPLOYMENT",
  PAYMENT = "PAYMENT",
  ORDER = "ORDER",
  SALE = "SALE",
  PROJECTS = "PROJECTS",
  LICENSES = "LICENSES",
  WELCOME = "WELCOME",
  ACCOUNT = "ACCOUNT",
}

// Notification type enum matching API (lowercase to match database enum)
export enum NotificationType {
  SYSTEM = "system",
  EMAIL = "email",
  SMS = "sms",
  PUSH = "push",
}

// Notification entity matching API response
export interface Notification {
  id: string;
  type: NotificationType;
  scope: NotificationScope | null;
  userId: string;
  recipient?: string;
  subject?: string;
  message: string;
  template?: string;
  data?: Record<string, unknown>;
  createdAt: string;
  processedAt?: string;
  status: string;
  error?: string;
  read: boolean;
  readAt?: string;
  updatedAt: string;
}

// Query parameters for fetching notifications
export interface QueryNotificationsParams {
  page?: number;
  limit?: number;
  types?: NotificationType[];
  scope?: NotificationScope;
  read?: boolean;
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

// Paginated response
export interface PaginatedNotificationsResponse {
  items: Notification[];
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

// Unread count response
export interface UnreadCountResponse {
  count: number;
}

// Update notification DTO
export interface UpdateNotificationDto {
  read?: boolean;
}

export const notificationsApi = createApi({
  reducerPath: "notificationsApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["Notifications", "UnreadCount"],
  endpoints: (builder) => ({
    // Get paginated notifications
    getNotifications: builder.query<
      PaginatedNotificationsResponse,
      QueryNotificationsParams
    >({
      query: (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append("page", params.page.toString());
        if (params.limit) queryParams.append("limit", params.limit.toString());
        // Always filter by SYSTEM type for in-app notifications
        const types = params.types || [NotificationType.SYSTEM];
        queryParams.append("types", types.join(","));
        if (params.scope) queryParams.append("scope", params.scope);
        if (params.read !== undefined)
          queryParams.append("read", params.read.toString());
        if (params.search) queryParams.append("search", params.search);
        if (params.status) queryParams.append("status", params.status);
        if (params.startDate) queryParams.append("startDate", params.startDate);
        if (params.endDate) queryParams.append("endDate", params.endDate);
        if (params.sortBy) queryParams.append("sortBy", params.sortBy);
        if (params.sortOrder) queryParams.append("sortOrder", params.sortOrder);
        return {
          url: `/notifications?${queryParams.toString()}`,
          method: "GET",
        };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({
                type: "Notifications" as const,
                id,
              })),
              { type: "Notifications", id: "LIST" },
            ]
          : [{ type: "Notifications", id: "LIST" }],
    }),

    // Get single notification
    getNotification: builder.query<Notification, string>({
      query: (id) => ({
        url: `/notifications/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "Notifications", id }],
    }),

    // Get unread notifications count (only SYSTEM type for in-app)
    getUnreadCount: builder.query<UnreadCountResponse, void>({
      query: () => ({
        url: `/notifications/unread/count?types=${NotificationType.SYSTEM}`,
        method: "GET",
      }),
      providesTags: ["UnreadCount"],
    }),

    // Update notification (mark as read)
    updateNotification: builder.mutation<
      Notification,
      { id: string; data: UpdateNotificationDto }
    >({
      query: ({ id, data }) => ({
        url: `/notifications/${id}`,
        method: "PATCH",
        data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Notifications", id },
        { type: "Notifications", id: "LIST" },
        "UnreadCount",
      ],
    }),

    // Mark all notifications as read (only SYSTEM type for in-app)
    markAllAsRead: builder.mutation<{ affected: number }, void>({
      query: () => ({
        url: `/notifications/read/all?types=${NotificationType.SYSTEM}`,
        method: "PATCH",
      }),
      invalidatesTags: [{ type: "Notifications", id: "LIST" }, "UnreadCount"],
    }),

    // Delete notification
    deleteNotification: builder.mutation<{ deleted: boolean }, string>({
      query: (id) => ({
        url: `/notifications/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Notifications", id },
        { type: "Notifications", id: "LIST" },
        "UnreadCount",
      ],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetNotificationQuery,
  useGetUnreadCountQuery,
  useUpdateNotificationMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,
} = notificationsApi;
