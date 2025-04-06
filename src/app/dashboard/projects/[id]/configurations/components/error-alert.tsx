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
 * Renders an error alert message.
 *
 * Displays a styled alert with an error icon, title, and description. The description defaults to a message indicating a failure to create or update a configuration based on the editing mode, unless a custom message is provided.
 *
 * @param isEditing - Indicates whether the alert pertains to an editing operation. When true, the default message warns of a configuration update failure.
 * @param title - The title displayed in the alert; defaults to "Error".
 * @param message - An optional custom error message. If not provided, a default message based on the editing state is used.
 * @param className - Optional additional CSS classes for custom styling.
 */
export function ErrorAlert({ 
  isEditing = false,
  title = "Error", 
  message,
  className
}: ErrorAlertProps) {
  const defaultMessage = isEditing
    ? "Failed to update configuration. Please try again."
    : "Failed to create configuration. Please try again.";

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