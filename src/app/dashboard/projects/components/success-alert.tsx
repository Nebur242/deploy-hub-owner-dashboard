import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SuccessAlertProps {
  isEditing: boolean;
  title?: string;
  message?: string;
  className?: string;
}

/**
 * Renders a styled success alert message.
 *
 * Displays an alert with a title and message that indicate a successful project update or creation.
 * The alert uses a default title of "Success" and selects a default message based on the value of
 * the isEditing prop unless a custom message is provided.
 *
 * @param isEditing - Indicates if the alert pertains to an update operation (true) or a creation (false).
 * @param title - Optional custom title for the alert; defaults to "Success".
 * @param message - Optional custom message; if omitted, a default message is shown based on isEditing.
 * @param className - Optional additional CSS classes for the alert container.
 *
 * @returns A React element representing the success alert.
 */
export function SuccessAlert({ 
  isEditing, 
  title = "Success", 
  message,
  className
}: SuccessAlertProps) {
  const defaultMessage = isEditing
    ? "Project updated successfully. Redirecting to projects list..."
    : "Project created successfully. You can now create another project or go back to the list.";

  return (
    <Alert 
      className={cn(
        "border-green-200 dark:border-green-900",
        "bg-green-50 dark:bg-green-950/50",
        className
      )}
    >
      <Check className="h-5 w-5 text-green-600 dark:text-green-500" />
      <AlertTitle className="text-green-800 dark:text-green-400">{title}</AlertTitle>
      <AlertDescription className="text-green-700 dark:text-green-400/90">
        {message || defaultMessage}
      </AlertDescription>
    </Alert>
  );
}