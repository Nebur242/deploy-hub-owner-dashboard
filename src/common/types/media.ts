import { z } from "zod";

export enum MediaType {
  IMAGE = "image",
  VIDEO = "video",
  DOCUMENT = "document",
  AUDIO = "audio",
  OTHER = "other",
}

export const mediaSchema = z.object({
  id: z.string(),
  filename: z.string(),
  originalFilename: z.string(),
  mimeType: z.string(),
  type: z.nativeEnum(MediaType),
  size: z.number(),
  url: z.string(),
  thumbnailUrl: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  duration: z.number().optional(),
  alt: z.string().optional(),
  metadata: z.record(z.string()).optional(),
  isPublic: z.boolean(),
  ownerId: z.string().optional(),
  tags: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Media = z.infer<typeof mediaSchema>;

export interface MediaQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: "ASC" | "DESC";
  type?: MediaType;
  ownerId?: string;
  tags?: string[];
  isPublic?: boolean;
  search?: string;
}

export interface MediaUploadState {
  uploading: boolean;
  progress: number;
  error: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
