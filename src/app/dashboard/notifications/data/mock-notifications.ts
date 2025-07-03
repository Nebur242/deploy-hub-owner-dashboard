import { NotificationType } from "../models/notification";

// Mock notification data
export const mockNotifications: NotificationType[] = [
  {
    id: "1",
    title: "Deployment successful",
    message:
      "Your project 'Product Dashboard' was successfully deployed to production.",
    type: "deployment",
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
    actionLink: "/dashboard/deployments/123",
    actionText: "View deployment",
  },
  {
    id: "2",
    title: "License expiring soon",
    message:
      "Your PRO license will expire in 7 days. Renew now to avoid service interruption.",
    type: "license",
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    actionLink: "/dashboard/licenses",
    actionText: "Renew license",
  },
  {
    id: "3",
    title: "New project collaborator",
    message:
      "John Doe has accepted your invitation to collaborate on 'API Backend'.",
    type: "project",
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    actionLink: "/dashboard/projects/456",
    actionText: "View project",
  },
  {
    id: "4",
    title: "System maintenance",
    message:
      "Scheduled maintenance will be performed on April 28, 2025, from 2 AM to 4 AM UTC.",
    type: "system",
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
  },
  {
    id: "5",
    title: "Deployment failed",
    message:
      "Deployment of 'Marketing Website' to staging environment failed. Check logs for details.",
    type: "deployment",
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26), // 26 hours ago
    actionLink: "/dashboard/deployments/789",
    actionText: "View logs",
  },
  {
    id: "6",
    title: "Project update available",
    message: "An update is available for the dependencies in 'Mobile App'.",
    type: "project",
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72), // 3 days ago
    actionLink: "/dashboard/projects/101",
    actionText: "View updates",
  },
  {
    id: "7",
    title: "License purchased",
    message:
      "Thank you for purchasing the Enterprise license. Your license has been activated.",
    type: "license",
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 96), // 4 days ago
    actionLink: "/dashboard/licenses",
    actionText: "View license",
  },
  {
    id: "8",
    title: "New feature available",
    message:
      "We've added a new feature to our platform: Multi-user authentication.",
    type: "system",
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 120), // 5 days ago
    actionLink: "/dashboard/settings",
    actionText: "Explore feature",
  },
];
