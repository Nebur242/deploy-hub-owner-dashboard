import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "@/config/api";
import {
  LicenseTicket,
  LicenseTicketMessage,
  LicenseTicketStatistics,
  CreateTicketMessageDto,
  UpdateLicenseTicketDto,
  QueryLicenseTicketsParams,
  PaginatedResponse,
} from "@/common/types";

export const licenseTicketsApi = createApi({
  reducerPath: "licenseTicketsApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["LicenseTicket", "LicenseTicketMessage", "LicenseTicketStats"],
  endpoints: (builder) => ({
    // Get owner's license tickets
    getOwnerLicenseTickets: builder.query<
      PaginatedResponse<LicenseTicket>,
      QueryLicenseTicketsParams
    >({
      query: (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append("page", params.page.toString());
        if (params.limit) queryParams.append("limit", params.limit.toString());
        if (params.status) queryParams.append("status", params.status);
        if (params.priority) queryParams.append("priority", params.priority);
        if (params.category) queryParams.append("category", params.category);
        if (params.user_license_id)
          queryParams.append("user_license_id", params.user_license_id);
        if (params.license_id)
          queryParams.append("license_id", params.license_id);
        if (params.search) queryParams.append("search", params.search);
        if (params.sortBy) queryParams.append("sortBy", params.sortBy);
        if (params.sortOrder) queryParams.append("sortOrder", params.sortOrder);
        if (params.unread !== undefined)
          queryParams.append("unread", params.unread.toString());
        return {
          url: `/license-tickets/owner-tickets?${queryParams.toString()}`,
          method: "GET",
        };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({
                type: "LicenseTicket" as const,
                id,
              })),
              { type: "LicenseTicket", id: "LIST" },
            ]
          : [{ type: "LicenseTicket", id: "LIST" }],
    }),

    // Get ticket statistics
    getTicketStatistics: builder.query<LicenseTicketStatistics, void>({
      query: () => ({
        url: "/license-tickets/owner-tickets/statistics",
        method: "GET",
      }),
      providesTags: [{ type: "LicenseTicketStats" }],
    }),

    // Get unread ticket count
    getOwnerUnreadCount: builder.query<{ count: number }, void>({
      query: () => ({
        url: "/license-tickets/owner-tickets/unread-count",
        method: "GET",
      }),
      providesTags: [{ type: "LicenseTicket", id: "UNREAD" }],
    }),

    // Get a specific license ticket
    getOwnerLicenseTicket: builder.query<LicenseTicket, string>({
      query: (id) => ({
        url: `/license-tickets/owner-tickets/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "LicenseTicket", id }],
    }),

    // Update a ticket
    updateOwnerTicket: builder.mutation<
      LicenseTicket,
      { ticketId: string; data: UpdateLicenseTicketDto }
    >({
      query: ({ ticketId, data }) => ({
        url: `/license-tickets/owner-tickets/${ticketId}`,
        method: "PATCH",
        data,
      }),
      invalidatesTags: (_result, _error, { ticketId }) => [
        { type: "LicenseTicket", id: ticketId },
        { type: "LicenseTicket", id: "LIST" },
        { type: "LicenseTicketStats" },
      ],
    }),

    // Add a message to a ticket
    addOwnerMessage: builder.mutation<
      LicenseTicketMessage,
      { ticketId: string; data: CreateTicketMessageDto }
    >({
      query: ({ ticketId, data }) => ({
        url: `/license-tickets/owner-tickets/${ticketId}/messages`,
        method: "POST",
        data,
      }),
      invalidatesTags: (_result, _error, { ticketId }) => [
        { type: "LicenseTicket", id: ticketId },
        { type: "LicenseTicket", id: "LIST" },
        { type: "LicenseTicket", id: "UNREAD" },
        { type: "LicenseTicketStats" },
      ],
    }),

    // Close a ticket
    closeOwnerTicket: builder.mutation<LicenseTicket, string>({
      query: (id) => ({
        url: `/license-tickets/owner-tickets/${id}/close`,
        method: "PATCH",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "LicenseTicket", id },
        { type: "LicenseTicket", id: "LIST" },
        { type: "LicenseTicketStats" },
      ],
    }),

    // Get ticket messages
    getTicketMessages: builder.query<LicenseTicketMessage[], string>({
      query: (ticketId) => ({
        url: `/license-tickets/${ticketId}/messages`,
        method: "GET",
      }),
      providesTags: (_result, _error, ticketId) => [
        { type: "LicenseTicketMessage", id: ticketId },
      ],
    }),
  }),
});

export const {
  useGetOwnerLicenseTicketsQuery,
  useGetTicketStatisticsQuery,
  useGetOwnerUnreadCountQuery,
  useGetOwnerLicenseTicketQuery,
  useUpdateOwnerTicketMutation,
  useAddOwnerMessageMutation,
  useCloseOwnerTicketMutation,
  useGetTicketMessagesQuery,
} = licenseTicketsApi;
