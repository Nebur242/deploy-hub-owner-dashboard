import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2 } from "lucide-react";
import { SuccessAlertProps } from "./types";

export function SuccessAlert({ isEditing }: SuccessAlertProps) {
    return (
        <Alert className="mb-6 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>
                Category {isEditing ? "updated" : "created"} successfully. Redirecting to categories page...
            </AlertDescription>
        </Alert>
    );
}