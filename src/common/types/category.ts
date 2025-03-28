import { User } from "../type";
import { Media } from "./media";

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  media?: Media;
  mediaId?: string;
  ownerId: string;
  owner: User;
  parentId?: string;
  parent?: Category;
  children: Category[];
  isActive: boolean;
  status: "active" | "inactive" | "pending";
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};
