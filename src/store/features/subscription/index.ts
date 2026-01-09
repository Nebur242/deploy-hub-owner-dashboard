import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "@/config/api";
import {
  Subscription,
  PlanConfig,
  CreateCheckoutSessionDto,
  UpdateSubscriptionDto,
  CheckoutResponse,
} from "@/common/types/subscription";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const subscriptionApi = createApi({
  reducerPath: "subscriptionApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["Subscription", "Plans"],
  endpoints: (builder) => ({
    // Get current user's subscription
    getSubscription: builder.query<Subscription, void>({
      query: () => ({
        url: "subscriptions",
        method: "GET",
      }),
      providesTags: ["Subscription"],
    }),

    // Get all available subscription plans (authenticated)
    getPlans: builder.query<PlanConfig[], void>({
      query: () => ({
        url: "subscriptions/plans",
        method: "GET",
      }),
      providesTags: ["Plans"],
    }),

    // Create a checkout session to upgrade subscription
    createCheckoutSession: builder.mutation<
      CheckoutResponse,
      CreateCheckoutSessionDto
    >({
      query: (dto) => ({
        url: "subscriptions/checkout",
        method: "POST",
        data: dto,
      }),
    }),

    // Create a billing portal session
    createPortalSession: builder.mutation<CheckoutResponse, void>({
      query: () => ({
        url: "subscriptions/portal",
        method: "POST",
      }),
    }),

    // Update subscription (change plan/billing interval)
    updateSubscription: builder.mutation<Subscription, UpdateSubscriptionDto>({
      query: (dto) => ({
        url: "subscriptions",
        method: "PUT",
        data: dto,
      }),
      invalidatesTags: ["Subscription"],
    }),

    // Cancel subscription at period end
    cancelSubscription: builder.mutation<Subscription, void>({
      query: () => ({
        url: "subscriptions/cancel",
        method: "POST",
      }),
      invalidatesTags: ["Subscription"],
    }),

    // Reactivate a canceled subscription
    reactivateSubscription: builder.mutation<Subscription, void>({
      query: () => ({
        url: "subscriptions/reactivate",
        method: "POST",
      }),
      invalidatesTags: ["Subscription"],
    }),
  }),
});

// Public plans API (no authentication required)
export const publicPlansApi = createApi({
  reducerPath: "publicPlansApi",
  baseQuery: fetchBaseQuery({
    baseUrl: API_URL,
  }),
  tagTypes: ["PublicPlans"],
  endpoints: (builder) => ({
    // Get all available subscription plans (public - no auth required)
    getPublicPlans: builder.query<PlanConfig[], void>({
      query: () => "/plans",
      transformResponse: (response: { data: PlanConfig[] }) =>
        response.data || response,
      providesTags: ["PublicPlans"],
    }),
  }),
});

export const {
  useGetSubscriptionQuery,
  useGetPlansQuery,
  useCreateCheckoutSessionMutation,
  useCreatePortalSessionMutation,
  useUpdateSubscriptionMutation,
  useCancelSubscriptionMutation,
  useReactivateSubscriptionMutation,
} = subscriptionApi;

export const { useGetPublicPlansQuery } = publicPlansApi;
