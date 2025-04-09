import { BaseEntity } from "./base";
import { MediaType } from "../dtos";

// Media entity
export interface Media extends BaseEntity {
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
  metadata?: Record<string, unknown>;
  isPublic: boolean;
  ownerId?: string;
  tags: string[];
}