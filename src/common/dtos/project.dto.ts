import { z } from "zod";
import { Visibility } from "../enums/project";

// Base schema for project data
const projectBaseDtoSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  repository: z.string().url("Invalid URL"),
  techStack: z.array(z.string()).min(1, "Select at least one technology"),
  visibility: z.nativeEnum(Visibility),
  categories: z
    .array(z.object({ id: z.string() }))
    .min(1, "Select at least one category"),
  previewUrl: z.string().url("Invalid URL").optional(),
  image: z.string().nullable().optional(),
});

// Schema for creating new projects
export const createProjectDtoSchema = projectBaseDtoSchema.extend({
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must contain only lowercase letters, numbers, and hyphens"
    ),
});

// Schema for updating existing projects
export const updateProjectDtoSchema = projectBaseDtoSchema.extend({
  id: z.string(),
});

// Schema for project query parameters
export const projectQueryParamsDtoSchema = z.object({
  page: z.number().min(1, { message: "Page must be at least 1" }).optional(),
  limit: z.number().min(1, { message: "Limit must be at least 1" }).optional(),
  search: z.string().optional(),
  techStack: z.string().optional(),
  visibility: z.nativeEnum(Visibility).optional(),
  categoryIds: z.array(z.string()).optional(),
  sortBy: z.string().optional(),
  sortDirection: z.enum(["ASC", "DESC"]).optional(),
});

// Type definitions from schemas
export type CreateProjectDto = z.infer<typeof createProjectDtoSchema>;
export type UpdateProjectDto = z.infer<typeof updateProjectDtoSchema>;
export type ProjectQueryParamsDto = z.infer<typeof projectQueryParamsDtoSchema>;
