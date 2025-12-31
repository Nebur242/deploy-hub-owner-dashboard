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

// License Option entity
export interface LicenseOption extends BaseEntity {
  name: string;
  description: string;
  price: number;
  currency: Currency;
  deployment_limit: number;
  period: LicensePeriod; // Billing period (forever = one-time, others = subscription)
  features: string[];
  projects: Project[]; // Multiple projects can be associated with a license
  owner_id: string; // UUID - Owner who created the license
  owner?: User; // Owner object (populated in responses)
  status: LicenseStatus; // Default: DRAFT
  popular: boolean; // Default: false
  stripe_product_id?: string;
  stripe_price_id?: string;
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
  owner_id: string; // UUID - User ID who owns the license
  owner?: User; // User object (populated in responses)
  license_id: string; // UUID - Reference to the license option
  license?: LicenseOption; // License option object (populated in some responses)
  expires_at?: Date | string; // Date when license expires (null for lifetime licenses)
  active: boolean; // Whether the license is currently active
  count: number; // Current number of deployments used
  max_deployments: number; // Maximum deployments allowed
  deployments: string[]; // Array of deployment IDs
  trial: boolean; // Whether this is a trial license
  metadata?: Record<string, unknown>; // Additional metadata (order info, payment details)
}
