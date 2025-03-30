import { UserCredential } from "firebase/auth";

export type Role = "admin" | "user" | "super_admin";

export type Status = "pending" | "success" | "error";

export type User = {
  id: string;
  uid: string;
  firstName?: string;
  lastName?: string;
  roles: Role[];
  createdAt: Date;
  updatedAt: Date;
};

export type AppUser = User & { firebase: UserCredential["user"] };

export type CreateUserDto = {
  email: string;
  password: string;
};

export type LoginUserDto = {
  email: string;
  password: string;
};

export type PaginatedResponse<T> = {
  items: T[];
  meta: {
    totalItems: number;
    itemCount: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
};
