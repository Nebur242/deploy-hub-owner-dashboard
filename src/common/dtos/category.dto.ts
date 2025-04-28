import { z } from "zod";

// Base schema for both create and update
const categoryBaseSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Name must be at least 3 characters" })
    .max(50, { message: "Name must be less than 50 characters" }),
  description: z
    .string()
    .min(1, { message: "Description is required" })
    .max(500, { message: "Description must be less than 500 characters" })
    .optional(),
  icon: z.string(),
  status: z.enum(["active", "inactive", "pending"]),
  sortOrder: z
    .number()
    .min(1, { message: "Sort order must be a positive number" }),
  parentId: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
});

// Create DTO schema - includes slug which is required for creation
export const createCategoryDtoSchema = categoryBaseSchema.extend({
  slug: z
    .string()
    .min(2, { message: "Slug must be at least 2 characters" })
    .regex(/^[a-z0-9-]+$/, {
      message: "Slug can only contain lowercase letters, numbers, and hyphens",
    }),
});

// Update DTO schema - includes id for updating
export const updateCategoryDtoSchema = categoryBaseSchema.extend({
  id: z.string(),
});

// Query params for fetching categories
export const categoryQueryParamsDtoSchema = z.object({
  page: z.number().min(1, { message: "Page must be at least 1" }).optional(),
  limit: z.number().min(1, { message: "Limit must be at least 1" }).optional(),
  search: z.string().optional(),
  parentId: z.string().optional(),
  status: z.enum(["active", "inactive", "pending"]).optional(),
});

// Type definitions from schemas
export type CreateCategoryDto = z.infer<typeof createCategoryDtoSchema>;
export type UpdateCategoryDto = z.infer<typeof updateCategoryDtoSchema>;
export type CategoryQueryParamsDto = z.infer<
  typeof categoryQueryParamsDtoSchema
>;
