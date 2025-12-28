import { z } from "zod";
import { Currency } from "../enums/project";
import { LicenseStatus } from "../types/license";

// Base schema for license data
const licenseBaseDtoSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.number().nonnegative("Price must be a non-negative number"),
  currency: z.nativeEnum(Currency).default(Currency.USD),
  deployment_limit: z.number().int().nonnegative().default(1),
  duration: z.number().int().nonnegative().default(0), // 0 for unlimited
  features: z.array(z.string()).default([]),
  status: z.nativeEnum(LicenseStatus).default(LicenseStatus.DRAFT),
  popular: z.boolean().default(false),
});

// Schema for creating new licenses
export const createLicenseDtoSchema = licenseBaseDtoSchema.extend({
  project_ids: z
    .array(z.string())
    .min(1, "At least one project must be associated"),
});

// Schema for updating existing licenses
export const updateLicenseDtoSchema = licenseBaseDtoSchema.extend({
  id: z.string(),
  project_ids: z.array(z.string()).optional(),
});

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
