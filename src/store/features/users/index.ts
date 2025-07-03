import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "@/config/api";
import {
  User,
  UserPreferences,
  NotificationSettings,
} from "@/common/types/user";

// Define the User API with RTK Query
export const userApi = createApi({
  reducerPath: "userApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["User"],
  endpoints: (builder) => ({
    // Get a user by UID
    getUser: builder.query<User, string>({
      query: (uid) => ({
        url: `/users/${uid}`,
        method: "GET",
      }),
      providesTags: (result, error, uid) => [{ type: "User", id: uid }],
    }),

    // Update a user
    updateUser: builder.mutation<
      User,
      { id: string; updateData: Partial<User> }
    >({
      query: ({ id, updateData }) => ({
        url: `/users/${id}`,
        method: "PATCH",
        data: updateData,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "User", id }],
    }),

    // Update user preferences
    updateUserPreferences: builder.mutation<
      User,
      { id: string; preferences: Partial<UserPreferences> }
    >({
      query: ({ id, preferences }) => ({
        url: `/users/${id}/preferences`,
        method: "PATCH",
        data: preferences,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "User", id }],
    }),

    // Update user notifications
    updateUserNotifications: builder.mutation<
      User,
      { id: string; notifications: Partial<NotificationSettings> }
    >({
      query: ({ id, notifications }) => ({
        url: `/users/${id}/notifications`,
        method: "PATCH",
        data: notifications,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "User", id }],
    }),
  }),
});

// Export auto-generated hooks
export const {
  useGetUserQuery,
  useUpdateUserMutation,
  useUpdateUserPreferencesMutation,
  useUpdateUserNotificationsMutation,
} = userApi;
