import { User } from "../type";

export type Media = {
  id: string;
  filename: string;
  originalFilename: string;
  mimeType: string;
  type: "image" | "video" | "document" | "audio" | "other";
  size: number;
  url: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  duration: number;
  alt: string;
  metadata: Record<string, string>;
  isPublic: boolean;
  ownerId: string;
  owner: User;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
};
