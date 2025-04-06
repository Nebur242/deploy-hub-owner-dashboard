import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ErrorAlertProps {
    title?: string;
    message: string;
    className?: string;
}

/**
 * Renders a styled error alert with an icon, title, and message.
 *
 * This component displays an error alert using predefined error styles. It shows an error icon,
 * a title (defaulting to "Error" if unspecified), and a descriptive error message. Optionally,
 * additional CSS classes can be provided to customize the alert's appearance.
 *
 * @param title - The title displayed in the alert header. Defaults to "Error" when not provided.
 * @param message - The error message shown in the alert body.
 * @param className - Additional CSS classes to apply to the alert component.
 */
export function ErrorAlert({ title = "Error", message, className }: ErrorAlertProps) {
    return (
        <Alert 
            className={cn(
                "mb-6 border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/50",
                className
            )}
        >
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-500" />
            <AlertTitle className="text-red-800 dark:text-red-400">{title}</AlertTitle>
            <AlertDescription className="text-red-700 dark:text-red-400/90">
                {message}
            </AlertDescription>
        </Alert>
    );
}