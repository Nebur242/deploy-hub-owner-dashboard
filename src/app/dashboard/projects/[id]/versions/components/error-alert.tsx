import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { IconAlertCircle } from "@tabler/icons-react";

interface ErrorAlertProps {
    isEditing: boolean;
    message: string;
}

export function ErrorAlert({ isEditing, message }: ErrorAlertProps) {
    return (
        <Alert className="bg-red-500/10 text-red-700 border-red-500">
            <IconAlertCircle className="h-4 w-4 text-red-500" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
                {isEditing
                    ? `Failed to update version: ${message}`
                    : `Failed to create version: ${message}`}
            </AlertDescription>
        </Alert>
    );
}