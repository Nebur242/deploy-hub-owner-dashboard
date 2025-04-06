import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ErrorAlertProps {
  isEditing?: boolean;
  title?: string;
  message?: string;
  className?: string;
}

/**
 * Renders an error alert with a customizable title and message.
 *
 * This component displays an error alert styled with a red theme and an accompanying icon.
 * It uses a default error message that varies based on the editing state—indicating either a failure
 * to create or update a project—unless a custom message is provided.
 *
 * @param isEditing - When true, sets the default message to indicate an update failure. Defaults to false.
 * @param title - The alert's title text. Defaults to "Error".
 * @param message - A custom error message; if not provided, a default message based on the editing state is shown.
 * @param className - Additional CSS classes for custom styling of the alert.
 */
export function ErrorAlert({ 
  isEditing = false,
  title = "Error", 
  message,
  className
}: ErrorAlertProps) {
  const defaultMessage = isEditing
    ? "Failed to update project. Please try again."
    : "Failed to create project. Please try again.";

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