import { createApi } from "@reduxjs/toolkit/query/react";
import { Order, Payment, ProcessPaymentRequest } from "@/common/types/order";
import { axiosBaseQuery } from "@/config/api";
import {
  SalesStats,
  SalesTrend,
  TopSellingLicense,
} from "@/common/types/statistics";

// Owner sales analytics response
interface SalesAnalyticsResponse {
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  failedOrders: number;
  cancelledOrders: number;
  refundedOrders: number;
  totalRevenue: number;
  pendingRevenue: number;
  averageOrderValue: number;
  conversionRate: number;
}

export const ordersApi = createApi({
  reducerPath: "ordersApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["Orders", "Order", "OwnerSales", "SalesAnalytics"],
  endpoints: (builder) => ({
    // ===== User/Buyer Order Endpoints =====
    getOrders: builder.query<
      {
        items: Order[];
        meta: {
          totalItems: number;
          itemCount: number;
          itemsPerPage: number;
          totalPages: number;
          currentPage: number;
        };
        links: { first: string; previous: string; next: string; last: string };
      },
      {
        page?: number;
        limit?: number;
        status?: string;
        licenseId?: string;
        currency?: string;
        isActive?: boolean;
        search?: string;
      }
    >({
      query: (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append("page", params.page.toString());
        if (params.limit) queryParams.append("limit", params.limit.toString());
        if (params.status) queryParams.append("status", params.status);
        if (params.licenseId)
          queryParams.append("license_id", params.licenseId);
        if (params.currency) queryParams.append("currency", params.currency);
        if (params.isActive)
          queryParams.append("isActive", params.isActive.toString());
        if (params.search) queryParams.append("search", params.search);
        return {
          url: `/orders?${queryParams.toString()}`,
          method: "GET",
        };
      },

      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({
                type: "Orders" as const,
                id,
              })),
              { type: "Orders", id: "LIST" },
            ]
          : [{ type: "Orders", id: "LIST" }],
    }),

    getOrderById: builder.query<Order, string>({
      query: (id) => ({
        url: `/orders/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "Order", id }],
    }),

    processPayment: builder.mutation<Payment, ProcessPaymentRequest>({
      query: (paymentData) => ({
        url: "/payments",
        method: "POST",
        data: {
          ...paymentData,
          amount: Number(paymentData.amount),
        },
      }),
      invalidatesTags: (result, error, { orderId }) => [
        { type: "Order", id: orderId },
        { type: "Orders", id: "LIST" },
      ],
    }),

    // ===== Owner/Seller Sales Endpoints =====
    getOwnerSales: builder.query<
      {
        items: Order[];
        meta: {
          totalItems: number;
          itemCount: number;
          itemsPerPage: number;
          totalPages: number;
          currentPage: number;
        };
        links: { first: string; previous: string; next: string; last: string };
      },
      {
        page?: number;
        limit?: number;
        status?: string;
        licenseId?: string;
        currency?: string;
        isActive?: boolean;
        search?: string;
      }
    >({
      query: (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append("page", params.page.toString());
        if (params.limit) queryParams.append("limit", params.limit.toString());
        if (params.status) queryParams.append("status", params.status);
        if (params.licenseId)
          queryParams.append("license_id", params.licenseId);
        if (params.currency) queryParams.append("currency", params.currency);
        if (params.isActive !== undefined)
          queryParams.append("is_active", params.isActive.toString());
        if (params.search) queryParams.append("search", params.search);
        return {
          url: `/orders/owner/sales?${queryParams.toString()}`,
          method: "GET",
        };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({
                type: "OwnerSales" as const,
                id,
              })),
              { type: "OwnerSales", id: "LIST" },
            ]
          : [{ type: "OwnerSales", id: "LIST" }],
    }),

    getOwnerOrderById: builder.query<Order, string>({
      query: (id) => ({
        url: `/orders/owner/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "OwnerSales", id }],
    }),

    getSalesAnalytics: builder.query<
      SalesAnalyticsResponse,
      { startDate?: string; endDate?: string }
    >({
      query: (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.startDate) queryParams.append("startDate", params.startDate);
        if (params.endDate) queryParams.append("endDate", params.endDate);
        return {
          url: `/orders/owner/analytics?${queryParams.toString()}`,
          method: "GET",
        };
      },
      providesTags: [{ type: "SalesAnalytics", id: "ANALYTICS" }],
    }),

    getSalesTrends: builder.query<
      SalesTrend[],
      { startDate: string; endDate: string; groupBy?: "day" | "week" | "month" }
    >({
      query: ({ startDate, endDate, groupBy = "day" }) => {
        const queryParams = new URLSearchParams();
        queryParams.append("startDate", startDate);
        queryParams.append("endDate", endDate);
        queryParams.append("groupBy", groupBy);
        return {
          url: `/orders/owner/trends?${queryParams.toString()}`,
          method: "GET",
        };
      },
      providesTags: [{ type: "SalesAnalytics", id: "TRENDS" }],
    }),

    getTopSellingLicenses: builder.query<
      TopSellingLicense[],
      { limit?: number; startDate?: string; endDate?: string }
    >({
      query: (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.limit) queryParams.append("limit", params.limit.toString());
        if (params.startDate) queryParams.append("startDate", params.startDate);
        if (params.endDate) queryParams.append("endDate", params.endDate);
        return {
          url: `/orders/owner/top-licenses?${queryParams.toString()}`,
          method: "GET",
        };
      },
      providesTags: [{ type: "SalesAnalytics", id: "TOP_LICENSES" }],
    }),

    getRecentOwnerOrders: builder.query<Order[], { limit?: number }>({
      query: (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.limit) queryParams.append("limit", params.limit.toString());
        return {
          url: `/orders/owner/recent?${queryParams.toString()}`,
          method: "GET",
        };
      },
      providesTags: [{ type: "OwnerSales", id: "RECENT" }],
    }),
  }),
});

export const {
  useGetOrdersQuery,
  useLazyGetOrdersQuery,
  useGetOrderByIdQuery,
  useLazyGetOrderByIdQuery,
  useProcessPaymentMutation,
  // Owner endpoints
  useGetOwnerSalesQuery,
  useLazyGetOwnerSalesQuery,
  useGetOwnerOrderByIdQuery,
  useGetSalesAnalyticsQuery,
  useGetSalesTrendsQuery,
  useGetTopSellingLicensesQuery,
  useGetRecentOwnerOrdersQuery,
} = ordersApi;
