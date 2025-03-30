import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2 } from "lucide-react";
import { ActionCardProps } from "./types";

export function ActionCard({
    handleDiscard,
    isLoading,
    success,
    isEditing
}: ActionCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading || success}
                >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {success && <CheckCircle2 className="mr-2 h-4 w-4" />}
                    {isLoading
                        ? (isEditing ? "Updating..." : "Creating...")
                        : success
                            ? (isEditing ? "Updated" : "Created")
                            : (isEditing ? "Save changes" : "Save category")}
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleDiscard}
                    disabled={isLoading}
                >
                    Reset Form
                </Button>
            </CardContent>
        </Card>
    );
}