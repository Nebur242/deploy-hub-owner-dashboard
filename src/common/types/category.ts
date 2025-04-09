import { BaseEntity } from "./base";
import { User } from "./user";

// Category entity
export interface Category extends BaseEntity {
  name: string;
  slug: string;
  description: string;
  icon: string;
  ownerId: string;
  owner: User;
  parentId?: string | null;
  parent?: Category;
  image?: string | null;
  children: Category[];
  status: "active" | "inactive" | "pending";
  sortOrder: number;
}
