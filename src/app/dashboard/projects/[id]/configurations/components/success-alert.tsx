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
 * Renders a success alert message with an accompanying check icon.
 *
 * Displays an alert with a title and description that varies based on the editing state.
 * When isEditing is true, the alert indicates a configuration update; otherwise, it indicates a configuration creation.
 * A custom message can override the default description, and additional CSS classes may be applied via the className prop.
 *
 * @param isEditing - Indicates whether the alert corresponds to an editing action.
 * @param title - The title of the alert; defaults to "Success".
 * @param message - An optional custom message to display instead of the default.
 * @param className - Additional CSS classes for custom styling.
 */
export function SuccessAlert({ 
  isEditing, 
  title = "Success", 
  message,
  className
}: SuccessAlertProps) {
  const defaultMessage = isEditing
    ? "Configuration updated successfully. Redirecting to project details..."
    : "Configuration created successfully. You can now create deployment settings or go back to the project.";

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