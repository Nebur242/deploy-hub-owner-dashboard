import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2 } from "lucide-react";
import { SuccessAlertProps } from "./types";
import { cn } from "@/lib/utils";

/**
 * Renders a success alert for category operations.
 *
 * Displays a styled alert with a success icon, title, and description. The description indicates
 * whether a category was updated or created based on the provided "isEditing" flag.
 *
 * @param isEditing - If true, the alert indicates that the category was updated; if false, it indicates a creation.
 */
export function SuccessAlert({ isEditing }: SuccessAlertProps) {
    return (
        <Alert className={cn(
            "mb-6 border-green-200 dark:border-green-900",
            "bg-green-50 dark:bg-green-950/50"
        )}>
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500" />
            <AlertTitle className="text-green-800 dark:text-green-400">Success</AlertTitle>
            <AlertDescription className="text-green-700 dark:text-green-400/90">
                Category {isEditing ? "updated" : "created"} successfully. Redirecting to categories page...
            </AlertDescription>
        </Alert>
    );
}