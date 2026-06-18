import { z } from "zod";
import { Currency } from "../enums/project";
import { LicenseStatus } from "../types/license";

// Base schema for license data
const licenseBaseFields = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  monthly_price: z
    .number()
    .nonnegative("Monthly price must be a non-negative number")
    .nullable()
    .optional(),
  yearly_price: z
    .number()
    .nonnegative("Yearly price must be a non-negative number")
    .nullable()
    .optional(),
  currency: z.nativeEnum(Currency),
  deployment_limit: z
    .number()
    .int()
    .min(5, "Deployment limit must be at least 5"),
  features: z.array(z.string()),
  status: z.nativeEnum(LicenseStatus),
  popular: z.boolean(),
  can_submit_support_ticket: z.boolean(), // User can submit support tickets
  can_redeploy: z.boolean(), // User can redeploy (same branch)
  can_update: z.boolean(), // User can update (redeploy with branch switch)
  has_priority_support: z.boolean(), // User has priority support
});

type PriceValidationShape = {
  monthly_price: z.ZodTypeAny;
  yearly_price: z.ZodTypeAny;
};

type PriceValidationData = {
  monthly_price?: number | null;
  yearly_price?: number | null;
};

const withPriceValidation = <T extends z.ZodRawShape & PriceValidationShape>(
  schema: z.ZodObject<T>,
) =>
  schema.refine(
    (data) => {
      const priceData = data as PriceValidationData;
      const monthly = Number(priceData.monthly_price || 0);
      const yearly = Number(priceData.yearly_price || 0);
      return monthly >= 0 && yearly >= 0;
    },
    {
      message: "Prices must be valid non-negative numbers",
    },
  );

// Schema for creating new licenses
export const createLicenseDtoSchema = withPriceValidation(
  licenseBaseFields.extend({
    project_ids: z
      .array(z.string())
      .min(1, "At least one project must be associated"),
  }),
);

// Schema for updating existing licenses
export const updateLicenseDtoSchema = withPriceValidation(
  licenseBaseFields.extend({
    id: z.string(),
    project_ids: z.array(z.string()).optional(),
  }),
);

// Schema for purchasing a license
export const purchaseLicenseDtoSchema = z.object({
  projectId: z.string(),
  licenseId: z.string(),
});

// Schema for confirming a license payment
export const confirmPaymentDtoSchema = z.object({
  purchaseId: z.string(),
  transactionId: z.string(),
});

export type LicenseSearchParams = {
  page?: number;
  limit?: number;
  search?: string;
  currency?: string;
  projectId?: string;
  sortBy?: string;
  sortDirection?: "ASC" | "DESC";
  status?: LicenseStatus;
  popular?: boolean;
};

export type LicensePurchaseSearchParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  licenseId?: string;
  projectId?: string;
  userId?: string;
  sortBy?: string;
  sortDirection?: "ASC" | "DESC";
  startDate?: string;
  endDate?: string;
};

// Type definitions from schemas
export type CreateLicenseDto = z.infer<typeof createLicenseDtoSchema>;
export type UpdateLicenseDto = z.infer<typeof updateLicenseDtoSchema>;
export type PurchaseLicenseDto = z.infer<typeof purchaseLicenseDtoSchema>;
export type ConfirmPaymentDto = z.infer<typeof confirmPaymentDtoSchema>;
