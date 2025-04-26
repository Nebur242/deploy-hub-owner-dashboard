// Notification types
export type NotificationType = {
  id: string;
  title: string;
  message: string;
  type: "system" | "deployment" | "license" | "project";
  read: boolean;
  createdAt: Date;
  actionLink?: string;
  actionText?: string;
  icon?: string; // Optional icon to show
};
