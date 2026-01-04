import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "@/config/api";

// Ticket status enum
export enum TicketStatus {
  OPEN = "open",
  IN_PROGRESS = "in_progress",
  RESOLVED = "resolved",
  CLOSED = "closed",
}

// Ticket priority enum
export enum TicketPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  URGENT = "urgent",
}

// Ticket category enum
export enum TicketCategory {
  GENERAL = "general",
  TECHNICAL = "technical",
  BILLING = "billing",
  ACCOUNT = "account",
  DEPLOYMENT = "deployment",
  LICENSE = "license",
  OTHER = "other",
}

// Support ticket entity
export interface SupportTicket {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  user_id?: string;
  assigned_to_id?: string;
  admin_notes?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

// Create ticket DTO
export interface CreateSupportTicketDto {
  name: string;
  email: string;
  subject: string;
  message: string;
  category?: TicketCategory;
  priority?: TicketPriority;
  attachments?: string[];
}

// Query params
export interface QuerySupportTicketsParams {
  page?: number;
  limit?: number;
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
  search?: string;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

// Paginated response
export interface PaginatedSupportTicketsResponse {
  items: SupportTicket[];
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

export const supportApi = createApi({
  reducerPath: "supportApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["SupportTickets"],
  endpoints: (builder) => ({
    // Create a support ticket
    createSupportTicket: builder.mutation<
      SupportTicket,
      CreateSupportTicketDto
    >({
      query: (data) => ({
        url: "/support",
        method: "POST",
        data,
      }),
      invalidatesTags: [{ type: "SupportTickets", id: "LIST" }],
    }),

    // Get current user's tickets
    getMyTickets: builder.query<
      PaginatedSupportTicketsResponse,
      QuerySupportTicketsParams
    >({
      query: (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append("page", params.page.toString());
        if (params.limit) queryParams.append("limit", params.limit.toString());
        if (params.status) queryParams.append("status", params.status);
        if (params.priority) queryParams.append("priority", params.priority);
        if (params.category) queryParams.append("category", params.category);
        if (params.search) queryParams.append("search", params.search);
        if (params.sortBy) queryParams.append("sortBy", params.sortBy);
        if (params.sortOrder) queryParams.append("sortOrder", params.sortOrder);
        return {
          url: `/support/my-tickets?${queryParams.toString()}`,
          method: "GET",
        };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({
                type: "SupportTickets" as const,
                id,
              })),
              { type: "SupportTickets", id: "LIST" },
            ]
          : [{ type: "SupportTickets", id: "LIST" }],
    }),

    // Get a specific ticket for current user
    getMyTicket: builder.query<SupportTicket, string>({
      query: (id) => ({
        url: `/support/my-tickets/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "SupportTickets", id }],
    }),
  }),
});

export const {
  useCreateSupportTicketMutation,
  useGetMyTicketsQuery,
  useGetMyTicketQuery,
} = supportApi;
