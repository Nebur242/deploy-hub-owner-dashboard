import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "@/config/api";
import { Order } from "@/common/types/order";
import { LicenseOption } from "@/common/types/license";

export type PayoutAccountStatus =
  | "not_started"
  | "onboarding"
  | "active"
  | "restricted"
  | "disabled";

export type TaxDocumentStatus =
  | "not_requested"
  | "required"
  | "submitted"
  | "verified";

export type LedgerStatus =
  | "pending"
  | "available"
  | "processing"
  | "paid"
  | "reversed"
  | "failed";

export interface OwnerPayoutAccount {
  id: string;
  owner_id: string;
  provider: "stripe_connect" | "stripe_global_payouts" | "manual";
  provider_recipient_id?: string;
  status: PayoutAccountStatus;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  tax_profile_status: TaxDocumentStatus;
  country?: string;
  default_currency?: string;
  last_synced_at?: string;
  requirements_due: string[];
  created_at: string;
  updated_at: string;
}

export interface OwnerBalanceSummary {
  pending: number;
  available: number;
  processing: number;
  paid: number;
  currency: string;
}

export interface OwnerLedgerEntry {
  id: string;
  owner_id: string;
  source_order_id: string;
  source_payment_id?: string;
  license_id: string;
  source_transaction_id?: string;
  type: "sale" | "refund" | "adjustment";
  status: LedgerStatus;
  currency: string;
  gross_sale_amount: string;
  platform_revenue_amount: string;
  royalty_amount: string;
  reserve_amount: string;
  available_at: string;
  processed_at?: string;
  provider_payout_id?: string;
  failure_reason?: string;
  order?: Order;
  license?: LicenseOption;
  created_at: string;
  updated_at: string;
}

export const payoutsApi = createApi({
  reducerPath: "payoutsApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["PayoutStatus", "PayoutBalance", "PayoutLedger"],
  endpoints: (builder) => ({
    getPayoutStatus: builder.query<OwnerPayoutAccount | null, void>({
      query: () => ({
        url: "/royalties/owner/recipient",
        method: "GET",
      }),
      providesTags: [{ type: "PayoutStatus", id: "CURRENT" }],
    }),
    syncPayoutStatus: builder.mutation<OwnerPayoutAccount, void>({
      query: () => ({
        url: "/royalties/owner/recipient/refresh",
        method: "POST",
      }),
      invalidatesTags: [
        { type: "PayoutStatus", id: "CURRENT" },
        { type: "PayoutBalance", id: "CURRENT" },
      ],
    }),
    createPayoutOnboardingLink: builder.mutation<
      { url: string; expires_at: number; account: OwnerPayoutAccount },
      { country?: string }
    >({
      query: (body) => ({
        url: "/royalties/owner/recipient/setup",
        method: "POST",
        data: body,
      }),
      invalidatesTags: [{ type: "PayoutStatus", id: "CURRENT" }],
    }),
    getPayoutBalance: builder.query<OwnerBalanceSummary, void>({
      query: () => ({
        url: "/royalties/owner/balance",
        method: "GET",
      }),
      providesTags: [{ type: "PayoutBalance", id: "CURRENT" }],
    }),
    getPayoutLedger: builder.query<OwnerLedgerEntry[], void>({
      query: () => ({
        url: "/royalties/owner/ledger",
        method: "GET",
      }),
      providesTags: [{ type: "PayoutLedger", id: "LIST" }],
    }),
  }),
});

export const {
  useGetPayoutStatusQuery,
  useSyncPayoutStatusMutation,
  useCreatePayoutOnboardingLinkMutation,
  useGetPayoutBalanceQuery,
  useGetPayoutLedgerQuery,
} = payoutsApi;
