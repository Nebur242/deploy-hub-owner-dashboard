import { User } from "../type";

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  ownerId: string;
  owner: User;
  parentId?: string;
  parent?: Category;
  children: Category[];
  status: "active" | "inactive" | "pending";
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateCategoryDto = {
  name: string;
  slug: string;
  description: string;
  icon: string;
  sortOrder: number;
  status: "active" | "inactive" | "pending";
  parentId?: string | null;
};

// Data transfer object for updating an existing category
export interface UpdateCategoryDto {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: "active" | "inactive" | "pending";
  parentId?: string | null;
  sortOrder: number;
}

export type CategoryQueryParams = {
  page?: number;
  limit?: number;
  search?: string;
  parentId?: string;
  status?: string;
};
