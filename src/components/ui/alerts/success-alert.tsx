import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type SuccessAlertProps = {
  title?: string;
  message?: string;
  className?: string;
  isEditing?: boolean;
  entityName?: string;
}

export function SuccessAlert({
  title = "Success",
  message,
  className,
  isEditing = false,
  entityName = "item"
}: SuccessAlertProps) {
  // Generate default message based on context if no message provided
  const defaultMessage = isEditing
    ? `${entityName} updated successfully. Redirecting...`
    : `${entityName} created successfully.`;

  return (
    <Alert
      className={cn(
        "border-green-200 dark:border-green-900",
        "bg-green-50 dark:bg-green-950/50",
        className
      )}
    >
      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500" />
      <AlertTitle className="text-green-800 dark:text-green-400">{title}</AlertTitle>
      <AlertDescription className="text-green-700 dark:text-green-400/90">
        {message || defaultMessage}
      </AlertDescription>
    </Alert>
  );
}