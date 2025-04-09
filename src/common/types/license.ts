import { BaseEntity } from "./base";
import { Currency, PurchaseStatus } from "../enums/project";
import { Project } from "./project";

// License Option entity
export interface LicenseOption extends BaseEntity {
  name: string;
  description: string;
  price: number;
  currency: Currency;
  deploymentLimit: number;
  duration: number; // in days, 0 for unlimited
  features: string[];
  projects: Project[]; // Multiple projects can be associated with a license
}

// License Purchase entity
export interface LicensePurchase extends BaseEntity {
  userId: string;
  projectId: string;
  licenseId: string;
  transactionId?: string;
  status: PurchaseStatus;
  amount: number;
  currency: Currency;
  deploymentsUsed: number;
  deploymentsAllowed: number;
  expiresAt?: string;
  project?: Project;
  license?: LicenseOption;
}
