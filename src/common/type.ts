export type Role = "admin" | "user" | "super_admin";

export type Status = "pending" | "success" | "error";

export type User = {
  id: number;
  firebaseUid: string;
  firstName?: string;
  lastName?: string;
  roles: Role[];
  createdAt: Date;
  updatedAt: Date;
};

export type CreateUserDto = {
  email: string;
  password: string;
};

export type LoginUserDto = {
  email: string;
  password: string;
};
