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
