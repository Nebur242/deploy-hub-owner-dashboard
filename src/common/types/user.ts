import { UserCredential } from "firebase/auth";

export type Role = "admin" | "user" | "super_admin";

export type Status = "pending" | "success" | "error";

export type UserPreferences = {
  id: string;
  theme: "light" | "dark" | "system";
  emailNotifications: boolean;
};

export type NotificationSettings = {
  id: string;
  projectUpdates?: boolean;
  deploymentAlerts?: boolean;
  licenseExpiration?: boolean;
  marketing?: boolean;
};

export type User = {
  id: string;
  uid: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
  company?: string;
  roles: Role[];
  preferences: UserPreferences;
  notifications: NotificationSettings;
  createdAt: Date;
  updatedAt: Date;
};

export type AppUser = User & { firebase: UserCredential["user"] };
