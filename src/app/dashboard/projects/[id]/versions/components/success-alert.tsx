import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { IconCheck } from "@tabler/icons-react";

interface SuccessAlertProps {
    isEditing: boolean;
}

export function SuccessAlert({ isEditing }: SuccessAlertProps) {
    return (
        <Alert className="bg-green-500/10 text-green-700 border-green-500">
            <IconCheck className="h-4 w-4 text-green-500" />
            <AlertTitle>Success!</AlertTitle>
            <AlertDescription>
                {isEditing
                    ? "Version has been updated successfully. Redirecting..."
                    : "Version has been created successfully. Redirecting..."}
            </AlertDescription>
        </Alert>
    );
}