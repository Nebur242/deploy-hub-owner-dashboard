import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ErrorAlertProps {
  isEditing?: boolean;
  title?: string;
  message?: string;
  className?: string;
}

export interface ErrorAlertProps {
  isEditing?: boolean;
  title?: string;
  message: string;
  className?: string;
  entityName?: string;
}

export function ErrorAlert({ 
  isEditing = false,
  title = "Error", 
  message,
  className,
  entityName
}: ErrorAlertProps) {
  const defaultMessage = isEditing
    ? `Failed to update ${entityName || 'item'}. Please try again.`
    : `Failed to create ${entityName || 'item'}. Please try again.`;

  return (
    <Alert 
      className={cn(
        "border-red-200 dark:border-red-900",
        "bg-red-50 dark:bg-red-950/50",
        className
      )}
    >
      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-500" />
      <AlertTitle className="text-red-800 dark:text-red-400">{title}</AlertTitle>
      <AlertDescription className="text-red-700 dark:text-red-400/90">
        {message || defaultMessage}
      </AlertDescription>
    </Alert>
  );
}