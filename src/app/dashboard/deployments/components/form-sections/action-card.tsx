"use client";

import { IconLoader } from "@tabler/icons-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ActionSectionProps } from "../types";

export function ActionCard({
  handleDiscard,
  isLoading,
  success,
  isEditing,
}: ActionSectionProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || success}
            >
              {isLoading ? (
                <>
                  <IconLoader className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>{isEditing ? "Update Deployment" : "Create Deployment"}</>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleDiscard}
              disabled={isLoading || success}
            >
              Discard Changes
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}