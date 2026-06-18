export enum SubscriptionStatus {
  ACTIVE = "active",
  CANCELED = "canceled",
  INCOMPLETE = "incomplete",
  INCOMPLETE_EXPIRED = "incomplete_expired",
  PAST_DUE = "past_due",
  TRIALING = "trialing",
  UNPAID = "unpaid",
  PAUSED = "paused",
}

export enum SubscriptionPlan {
  FREE = "free",
  STARTER = "starter",
  PRO = "pro",
}

export enum BillingInterval {
  MONTHLY = "monthly",
  YEARLY = "yearly",
}

export type BillingProvider = "stripe";
export type CheckoutMode = "redirect";

export interface Subscription {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  billing_interval: BillingInterval | null;
  currency: string;
  amount: number;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at: string | null;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  trial_start: string | null;
  trial_end: string | null;
  max_projects: number;
  max_github_accounts: number; // Max GitHub accounts per project (-1 = unlimited)
  max_licenses_per_project: number; // Max licenses that can be associated with a single project
  platform_fee_percent: number; // Platform fee percentage on license sales
  custom_domain_enabled: boolean;
  priority_support: boolean;
  analytics_enabled: boolean;
  ai_assistant_enabled: boolean;
  metadata: {
    billing_provider?: BillingProvider;
    stripe_customer_id?: string;
    stripe_subscription_id?: string;
    stripe_price_id?: string;
    [key: string]: unknown;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface PlanConfig {
  plan: SubscriptionPlan;
  name: string;
  description: string;
  maxProjects: number;
  maxLicensesPerProject: number; // Max licenses that can be associated with a single project
  maxGithubAccounts: number; // -1 = unlimited
  platformFeePercent: number; // Platform fee percentage (e.g., 50 = 50%)
  customDomainEnabled: boolean;
  prioritySupport: boolean;
  analyticsEnabled: boolean;
  aiAssistantEnabled: boolean;
  monthlyPrice: number;
  yearlyPrice: number;
  stripeReady?: boolean;
}

export interface CreateCheckoutSessionDto {
  plan: SubscriptionPlan;
  billing_interval: BillingInterval;
  success_url?: string;
  cancel_url?: string;
}

export interface UpdateSubscriptionDto {
  plan?: SubscriptionPlan;
  billing_interval?: BillingInterval;
  cancel_at_period_end?: boolean;
}

export interface CheckoutResponse {
  provider: BillingProvider;
  mode: CheckoutMode;
  url?: string;
  customerId?: string;
  priceId?: string;
  successUrl?: string;
  metadata?: Record<string, string>;
  sessionId?: string;
}

export interface BillingPortalResponse {
  provider: BillingProvider;
  url?: string;
  updatePaymentMethod?: string;
  cancel?: string;
}
