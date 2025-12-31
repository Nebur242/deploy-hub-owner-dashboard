import {
  Notification,
  NotificationScope,
  NotificationType,
} from "@/store/features/notifications";

// Re-export types from store for backward compatibility
export type { Notification as NotificationEntity };
export { NotificationScope, NotificationType };

// UI notification type (transformed from API notification)
export interface UINotification {
  id: string;
  title: string;
  message: string;
  type: "system" | "sale" | "order" | "deployment" | "welcome" | "license";
  read: boolean;
  createdAt: Date;
  actionLink?: string;
  actionText?: string;
  scope?: NotificationScope;
  data?: Record<string, unknown>;
}

// Map NotificationScope to UI type
export function mapScopeToType(
  scope: NotificationScope | null,
  apiType: NotificationType
): UINotification["type"] {
  if (scope) {
    switch (scope) {
      case NotificationScope.SALE:
        return "sale";
      case NotificationScope.ORDER:
        return "order";
      case NotificationScope.DEPLOYMENT:
        return "deployment";
      case NotificationScope.WELCOME:
        return "welcome";
      case NotificationScope.LICENSES:
        return "license";
      case NotificationScope.PROJECTS:
        return "deployment";
      case NotificationScope.PAYMENT:
        return "order";
      case NotificationScope.ACCOUNT:
        return "system";
      default:
        return "system";
    }
  }

  // Fallback based on notification type
  if (apiType === NotificationType.SYSTEM) return "system";
  return "system";
}

// Get action link based on notification data and scope
export function getActionLink(notification: Notification): string | undefined {
  const data = notification.data;
  if (!data) return undefined;

  // Check for URL in data
  if (data.url && typeof data.url === "string") {
    return data.url;
  }

  // Generate links based on scope
  switch (notification.scope) {
    case NotificationScope.SALE:
    case NotificationScope.ORDER:
      if (data.orderId) return `/dashboard/orders/${data.orderId}`;
      return "/dashboard/sales";

    case NotificationScope.DEPLOYMENT:
      if (data.deploymentId)
        return `/dashboard/deployments/${data.deploymentId}`;
      return "/dashboard/deployments";

    case NotificationScope.LICENSES:
      if (data.licenseId) return `/dashboard/licenses/${data.licenseId}`;
      return "/dashboard/licenses";

    case NotificationScope.PROJECTS:
      if (data.projectId) return `/dashboard/projects/${data.projectId}`;
      return "/dashboard/projects";

    default:
      return undefined;
  }
}

// Get action text based on scope
export function getActionText(
  scope: NotificationScope | null
): string | undefined {
  switch (scope) {
    case NotificationScope.SALE:
      return "View sale";
    case NotificationScope.ORDER:
      return "View order";
    case NotificationScope.DEPLOYMENT:
      return "View deployment";
    case NotificationScope.LICENSES:
      return "View license";
    case NotificationScope.PROJECTS:
      return "View project";
    default:
      return undefined;
  }
}

// Transform API notification to UI notification
export function transformNotification(
  notification: Notification
): UINotification {
  return {
    id: notification.id,
    title: notification.subject || "Notification",
    message: notification.message,
    type: mapScopeToType(notification.scope, notification.type),
    read: notification.read,
    createdAt: new Date(notification.createdAt),
    actionLink: getActionLink(notification),
    actionText: getActionText(notification.scope),
    scope: notification.scope || undefined,
    data: notification.data,
  };
}

// Transform array of notifications
export function transformNotifications(
  notifications: Notification[]
): UINotification[] {
  return notifications.map(transformNotification);
}
