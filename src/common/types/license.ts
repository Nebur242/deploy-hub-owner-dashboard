import { BaseEntity } from "./base";
import { Currency, PurchaseStatus } from "../enums/project";
import { Project } from "./project";
import { User } from "./user";

export enum LicenseStatus {
  DRAFT = "draft",
  PUBLIC = "public",
  PRIVATE = "private",
  ARCHIVED = "archived",
}

/**
 * License billing period - determines if license is one-time or subscription
 * FOREVER = one-time purchase
 * Others = recurring subscription
 */
export enum LicensePeriod {
  WEEKLY = "weekly",
  BIWEEKLY = "biweekly",
  MONTHLY = "monthly",
  YEARLY = "yearly",
  FOREVER = "forever",
}

export enum LicenseBillingInterval {
  MONTHLY = "monthly",
  YEARLY = "yearly",
}

// License Option entity
export interface LicenseOption extends BaseEntity {
  name: string;
  description: string;
  price: number;
  monthly_price?: number | null;
  yearly_price?: number | null;
  currency: Currency;
  deployment_limit: number;
  period: LicensePeriod; // Billing period (forever = one-time, others = subscription)
  billing_intervals?: LicenseBillingInterval[];
  features: string[];
  projects: Project[]; // Multiple projects can be associated with a license
  owner_id: string; // UUID - Owner who created the license
  owner?: User; // Owner object (populated in responses)
  status: LicenseStatus; // Default: DRAFT
  popular: boolean; // Default: false
  can_submit_support_ticket: boolean; // User can submit support tickets
  can_redeploy: boolean; // User can redeploy (same branch)
  can_update: boolean; // User can update (redeploy with branch switch)
  has_priority_support: boolean; // User has priority support
  stripe_product_id?: string;
  stripe_price_id?: string;
}

export function getLicenseBillingIntervals(license: Pick<LicenseOption, "monthly_price" | "yearly_price">): LicenseBillingInterval[] {
  const intervals: LicenseBillingInterval[] = [];
  if (Number(license.monthly_price || 0) > 0) {
    intervals.push(LicenseBillingInterval.MONTHLY);
  }
  if (Number(license.yearly_price || 0) > 0) {
    intervals.push(LicenseBillingInterval.YEARLY);
  }
  return intervals;
}

export function isFreeLicense(license: Pick<LicenseOption, "monthly_price" | "yearly_price">): boolean {
  return getLicenseBillingIntervals(license).length === 0;
}

export function getLicensePrimaryInterval(license: LicenseOption): LicenseBillingInterval | null {
  return getLicenseBillingIntervals(license)[0] || null;
}

export function getLicensePriceForInterval(
  license: Pick<LicenseOption, "monthly_price" | "yearly_price">,
  interval: LicenseBillingInterval,
): number | null {
  const value =
    interval === LicenseBillingInterval.YEARLY ? license.yearly_price : license.monthly_price;
  return Number(value || 0) > 0 ? Number(value) : null;
}

export function getLicensePriceSummary(license: LicenseOption): string {
  const monthly = getLicensePriceForInterval(license, LicenseBillingInterval.MONTHLY);
  const yearly = getLicensePriceForInterval(license, LicenseBillingInterval.YEARLY);

  if (monthly !== null && yearly !== null) {
    return "Monthly + yearly";
  }

  if (monthly !== null) {
    return "Monthly";
  }

  if (yearly !== null) {
    return "Yearly";
  }

  return "Free";
}

// License Purchase entity
export interface LicensePurchase extends BaseEntity {
  user_id: string;
  project_id: string;
  license_id: string;
  transaction_id?: string;
  status: PurchaseStatus;
  amount: number;
  currency: Currency;
  deployments_used: number;
  deployments_allowed: number;
  expires_at?: string;
  project?: Project;
  license?: LicenseOption;
}

// UserLicense entity - represents actual license ownership with deployment tracking
export interface UserLicense extends BaseEntity {
  title?: string; // Custom title to differentiate between multiple licenses
  owner_id: string; // UUID - User ID who owns the license
  owner?: User; // User object (populated in responses)
  license_id: string; // UUID - Reference to the license option
  license?: LicenseOption; // License option object (populated in some responses)
  expires_at?: Date | string; // Date when license expires (null for lifetime licenses)
  active: boolean; // Whether the license is currently active
  count: number; // Total deployments used (deployments + redeployments)
  redeployment_count: number; // Number of redeployments used
  max_deployments: number; // Maximum deployments allowed
  deployments: string[]; // Array of deployment IDs
  redeployments: string[]; // Array of redeployment IDs
  trial: boolean; // Whether this is a trial license
  metadata?: Record<string, unknown>; // Additional metadata (order info, payment details)
}
