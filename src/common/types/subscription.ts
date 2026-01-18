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

export interface DeploymentPool {
  total: number;
  allocated: number;
  available: number;
}

export interface Subscription {
  id: string;
  user_id: string;
  paddle_customer_id: string | null;
  paddle_subscription_id: string | null;
  paddle_price_id: string | null;
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
  max_github_accounts: number; // Max GitHub accounts per project (-1 = unlimited)
  max_licenses_per_project: number; // Max licenses per project
  platform_fee_percent: number; // Platform fee percentage on license sales
  custom_domain_enabled: boolean;
  priority_support: boolean;
  analytics_enabled: boolean;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  // Deployment pool info from API
  deployment_pool?: DeploymentPool;
}

export interface PlanConfig {
  plan: SubscriptionPlan;
  name: string;
  description: string;
  maxProjects: number;
  maxLicensesPerProject: number; // Max licenses per project
  maxDeploymentsPerMonth: number; // -1 = unlimited
  maxGithubAccounts: number; // -1 = unlimited
  platformFeePercent: number; // Platform fee percentage (e.g., 50 = 50%)
  customDomainEnabled: boolean;
  prioritySupport: boolean;
  analyticsEnabled: boolean;
  monthlyPrice: number;
  yearlyPrice: number;
  paddlePriceIdMonthly?: string;
  paddlePriceIdYearly?: string;
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

// Paddle checkout response (for Paddle.js overlay)
export interface PaddleCheckoutResponse {
  customerId: string;
  priceId: string;
  successUrl: string;
  clientToken: string;
  environment: string;
  metadata: Record<string, string>;
}

// Legacy support for URL-based checkout (not used with Paddle)
export interface CheckoutResponse {
  url?: string;
  // Paddle checkout data
  customerId?: string;
  priceId?: string;
  successUrl?: string;
  clientToken?: string;
  environment?: string;
  metadata?: Record<string, string>;
}
