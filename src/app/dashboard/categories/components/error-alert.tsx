import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ErrorAlertProps {
    title?: string;
    message: string;
    className?: string;
}

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