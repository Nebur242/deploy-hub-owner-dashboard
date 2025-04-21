"use client";

import { Badge } from "@/components/ui/badge";
import { DeploymentStatus } from "@/store/features/deployments";
import { IconClockHour4, IconLoader, IconCheck, IconX } from "@tabler/icons-react";

interface DeploymentStatusBadgeProps {
  status: DeploymentStatus;
  size?: "sm" | "md" | "lg";
}

export default function DeploymentStatusBadge({ 
  status, 
  size = "md" 
}: DeploymentStatusBadgeProps) {
  // Adjust icon size based on badge size
  const getIconSize = () => {
    switch (size) {
      case "sm": return "h-3 w-3";
      case "lg": return "h-4 w-4";
      default: return "h-3.5 w-3.5";
    }
  };
  
  const iconClass = `${getIconSize()} mr-1`;
  
  switch (status) {
    case DeploymentStatus.PENDING:
      return (
        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20">
          <IconClockHour4 className={iconClass} /> Pending
        </Badge>
      );
    case DeploymentStatus.RUNNING:
      return (
        <Badge variant="outline" className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">
          <IconLoader className={`${iconClass} animate-spin`} /> Running
        </Badge>
      );
    case DeploymentStatus.SUCCESS:
      return (
        <Badge variant="outline" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
          <IconCheck className={iconClass} /> Success
        </Badge>
      );
    case DeploymentStatus.FAILED:
      return (
        <Badge variant="outline" className="bg-red-500/10 text-red-500 hover:bg-red-500/20">
          <IconX className={iconClass} /> Failed
        </Badge>
      );
    case DeploymentStatus.CANCELED:
      return (
        <Badge variant="outline" className="bg-gray-500/10 text-gray-500 hover:bg-gray-500/20">
          <IconX className={iconClass} /> Canceled
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}