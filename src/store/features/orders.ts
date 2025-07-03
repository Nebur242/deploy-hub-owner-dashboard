import { createApi } from "@reduxjs/toolkit/query/react";
import { Order, Payment, ProcessPaymentRequest } from "@/common/types/order";
import { axiosBaseQuery } from "@/config/api";

export const ordersApi = createApi({
  reducerPath: "ordersApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["Orders", "Order"],
  endpoints: (builder) => ({
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
        if (params.licenseId) queryParams.append("licenseId", params.licenseId);
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
  }),
});

export const {
  useGetOrdersQuery,
  useLazyGetOrdersQuery,
  useGetOrderByIdQuery,
  useLazyGetOrderByIdQuery,
  useProcessPaymentMutation,
} = ordersApi;
