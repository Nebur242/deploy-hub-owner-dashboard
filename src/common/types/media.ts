import { BaseEntity } from "./base";
import { MediaType } from "../dtos";

// Media entity
export interface Media extends BaseEntity {
  filename: string;
  original_filename: string;
  mime_type: string;
  type: MediaType;
  size: number;
  url: string;
  thumbnail_url?: string;
  width?: number;
  height?: number;
  duration?: number;
  alt?: string;
  metadata?: Record<string, unknown>;
  is_public: boolean;
  owner_id?: string;
  tags: string[];
}
