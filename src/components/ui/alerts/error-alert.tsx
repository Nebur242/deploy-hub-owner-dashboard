import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ErrorAlertProps = {
  title?: string;
  message?: string;
  className?: string;
  isEditing?: boolean;
  entityName?: string;
}

export function ErrorAlert({ 
  title = "Error", 
  message,
  className,
  isEditing = false,
  entityName = "item"
}: ErrorAlertProps) {
  // Generate default message based on context if no message provided
  const defaultMessage = isEditing
    ? `Failed to update ${entityName}. Please try again.`
    : `Failed to create ${entityName}. Please try again.`;

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