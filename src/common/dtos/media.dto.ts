import { z } from "zod";

export enum MediaType {
  IMAGE = "image",
  VIDEO = "video",
  DOCUMENT = "document",
  AUDIO = "audio",
  OTHER = "other",
}

// Base schema for media metadata
export const mediaMetadataDtoSchema = z.object({
  width: z.number().optional(),
  height: z.number().optional(),
  duration: z.number().optional(),
  alt: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

// Schema for creating/uploading new media
export const createMediaDtoSchema = z.object({
  file: z.any(), // This would be a File object in the frontend
  filename: z.string(),
  type: z.nativeEnum(MediaType),
  alt: z.string().optional(),
  metadata: z.record(z.string(), z.string()).optional(),
  is_public: z.boolean().default(true),
  tags: z.array(z.string()).default([]),
});

// Schema for updating existing media
export const updateMediaDtoSchema = z.object({
  id: z.string(),
  filename: z.string().optional(),
  alt: z.string().optional(),
  metadata: z.record(z.string(), z.string()).optional(),
  is_public: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

// Schema for media query parameters
export const mediaQueryParamsDtoSchema = z.object({
  page: z.number().min(1, { message: "Page must be at least 1" }).optional(),
  limit: z.number().min(1, { message: "Limit must be at least 1" }).optional(),
  sortBy: z.string().optional(),
  order: z.enum(["ASC", "DESC"]).optional(),
  type: z.nativeEnum(MediaType).optional(),
  owner_id: z.string().optional(),
  tags: z.array(z.string()).optional(),
  is_public: z.boolean().optional(),
  search: z.string().optional(),
});

// Type definitions from schemas
export type MediaMetadataDto = z.infer<typeof mediaMetadataDtoSchema>;
export type CreateMediaDto = z.infer<typeof createMediaDtoSchema>;
export type UpdateMediaDto = z.infer<typeof updateMediaDtoSchema>;
export type MediaQueryParamsDto = z.infer<typeof mediaQueryParamsDtoSchema>;
