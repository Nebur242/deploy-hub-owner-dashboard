export enum MediaType {
  IMAGE = "image",
  VIDEO = "video",
  DOCUMENT = "document",
  AUDIO = "audio",
  OTHER = "other",
}

export interface Media {
  id: string;
  filename: string;
  originalFilename: string;
  mimeType: string;
  type: MediaType;
  size: number;
  url: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  duration?: number;
  alt?: string;
  metadata?: Record<string, string>;
  isPublic: boolean;
  ownerId?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

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
