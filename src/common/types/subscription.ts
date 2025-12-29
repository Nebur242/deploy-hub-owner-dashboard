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
  ENTERPRISE = "enterprise",
}

export enum BillingInterval {
  MONTHLY = "monthly",
  YEARLY = "yearly",
}

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
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
  max_deployments_per_month: number;
  custom_domain_enabled: boolean;
  priority_support: boolean;
  analytics_enabled: boolean;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface PlanConfig {
  plan: SubscriptionPlan;
  name: string;
  description: string;
  maxProjects: number;
  maxDeploymentsPerMonth: number;
  customDomainEnabled: boolean;
  prioritySupport: boolean;
  analyticsEnabled: boolean;
  monthlyPrice: number;
  yearlyPrice: number;
  stripePriceIdMonthly?: string;
  stripePriceIdYearly?: string;
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
  url: string;
}
