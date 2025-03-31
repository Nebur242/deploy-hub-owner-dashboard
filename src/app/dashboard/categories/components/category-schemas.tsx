import { z } from "zod";

// Define the schema for form validation
export const categorySchema = z.object({
  name: z
    .string()
    .min(3, { message: "Name must be at least 3 characters" })
    .max(50, { message: "Name must be less than 50 characters" }),
  slug: z
    .string()
    .min(2, { message: "Slug must be at least 2 characters" })
    .regex(/^[a-z0-9-]+$/, {
      message: "Slug can only contain lowercase letters, numbers, and hyphens",
    }),
  description: z
    .string()
    .min(1, { message: "Description is required" })
    .max(500, { message: "Description must be less than 500 characters" }),
  icon: z.string(),
  status: z.enum(["active", "inactive", "pending"]),
  parentCategory: z.string().optional(),
  sortOrder: z
    .number()
    .min(1, { message: "Sort order must be a positive number" }),
});

// Extended schema for updates that includes id
export const categoryUpdateSchema = categorySchema.extend({
  id: z.string(),
});
