import { z } from "zod";

// Semantic version regex pattern
const semverPattern =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

// Base schema for version data
const versionBaseDtoSchema = z.object({
  release_notes: z.string().optional(),
  commit_hash: z.string().optional(),
  is_stable: z.boolean().default(false),
});

// Schema for creating new project versions
export const createVersionDtoSchema = versionBaseDtoSchema.extend({
  version: z
    .string()
    .min(1, "Version is required")
    .regex(
      semverPattern,
      "Version must follow semantic versioning format (X.Y.Z)"
    ),
  branch: z.string().optional(),
  project_id: z.string(),
});

// Schema for updating existing project versions
export const updateVersionDtoSchema = z.object({
  id: z.string(),
  project_id: z.string(),
  release_notes: z.string().optional(),
  commit_hash: z.string().optional(),
});

// Schema for setting a version as stable
export const setVersionAsStableDtoSchema = z.object({
  id: z.string(),
  project_id: z.string(),
});

// Type definitions from schemas
export type CreateVersionDto = z.infer<typeof createVersionDtoSchema>;
export type UpdateVersionDto = z.infer<typeof updateVersionDtoSchema>;
export type SetVersionAsStableDto = z.infer<typeof setVersionAsStableDtoSchema>;
