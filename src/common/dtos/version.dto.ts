import { z } from "zod";

// Semantic version regex pattern
const semverPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

// Base schema for version data
const versionBaseDtoSchema = z.object({
  releaseNotes: z.string().optional(),
  commitHash: z.string().optional(),
  isStable: z.boolean().default(false),
});

// Schema for creating new project versions
export const createVersionDtoSchema = versionBaseDtoSchema.extend({
  version: z.string()
    .min(1, "Version is required")
    .regex(
      semverPattern,
      "Version must follow semantic versioning format (X.Y.Z)"
    ),
  projectId: z.string(),
});

// Schema for updating existing project versions
export const updateVersionDtoSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  releaseNotes: z.string().optional(),
  commitHash: z.string().optional(),
});

// Schema for setting a version as stable
export const setVersionAsStableDtoSchema = z.object({
  id: z.string(),
  projectId: z.string(),
});

// Type definitions from schemas
export type CreateVersionDto = z.infer<typeof createVersionDtoSchema>;
export type UpdateVersionDto = z.infer<typeof updateVersionDtoSchema>;
export type SetVersionAsStableDto = z.infer<typeof setVersionAsStableDtoSchema>;