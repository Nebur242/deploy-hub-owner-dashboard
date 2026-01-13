import { UserCredential } from "firebase/auth";
import { BillingInfo } from "./order";

export type RoleName = "admin" | "user" | "owner";

export type Role = {
  id: string;
  name: RoleName;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
};

// Helper function to check if user has a specific role
export const hasRole = (roles: Role[], roleName: RoleName): boolean => {
  return roles.some((role) => role.name === roleName);
};

export type Status = "pending" | "success" | "error";

export type DeveloperType = "individual" | "company" | "agency";

export type OwnerStatus = "pending" | "approved" | "rejected";

export type OwnerProfile = {
  id: string;
  user_id: string;
  company_name?: string;
  developer_type: DeveloperType;
  country: string;
  website_url?: string;
  github_url?: string;
  terms_accepted: boolean;
  terms_accepted_at?: Date;
  status: OwnerStatus;
  rejection_reason?: string;
  approved_at?: Date;
  created_at: Date;
  updated_at: Date;
};

// export type BillingInfo = {
//   first_name: string;
//   last_name: string;
//   email: string;
//   company: string;
//   address: string;
//   city: string;
//   state: string;
//   postal_code: string;
//   country: string;
// };

export type UserPreferences = {
  id: string;
  theme: "light" | "dark" | "system";
  email_notifications: boolean;
  preferred_deployment_providers: string[] | null;
  billings?: BillingInfo[];
};

export type NotificationSettings = {
  id: string;
  project_updates: boolean;
  deployment_alerts: boolean;
  license_expiration: boolean;
  marketing: boolean;
};

export type User = {
  id: string;
  uid: string;
  email: string;
  first_name?: string;
  last_name?: string;
  profile_picture?: string;
  company?: string;
  roles: Role[];
  preferences: UserPreferences;
  notifications: NotificationSettings;
  total_deployments: number;
  created_at: Date;
  updated_at: Date;
};

export type AppUser = User & { firebase: UserCredential["user"] };
