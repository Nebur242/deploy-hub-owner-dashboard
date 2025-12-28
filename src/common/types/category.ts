import { BaseEntity } from "./base";
import { User } from "./user";

// Category status enum
export type CategoryStatus = "active" | "inactive" | "pending" | "deleted";

// Category entity
export interface Category extends BaseEntity {
  name: string;
  slug: string;
  description: string;
  icon: string;
  owner_id: string;
  owner: User;
  parent_id?: string | null;
  parent?: Category;
  image?: string | null;
  children: Category[];
  status: CategoryStatus;
  sort_order: number;
}
