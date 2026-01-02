"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGetProjectQuery, useModeratePendingChangesMutation } from "@/store/features/projects";
import { useFindAllCategoriesQuery } from "@/store/features/categories";
import {
  IconArrowBack,
  IconLoader,
  IconCheck,
  IconX,
  IconArrowRight,
} from "@tabler/icons-react";
import Link from "next/link";
import DashboardLayout from "@/components/dashboard-layout";
import { BreadcrumbItem } from "@/components/breadcrumb";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ModerationStatus } from "@/common/enums/project";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface ChangeFieldProps {
  label: string;
  original: string | undefined | null;
  pending: string | undefined | null;
}

function ChangeField({ label, original, pending }: ChangeFieldProps) {
  // Only show if this field was actually included in pending changes (pending is not undefined)
  // and if the value is different
  const hasChanged = pending !== undefined && original !== pending;
  
  // Don't render if there's no change
  if (!hasChanged) {
    return null;
  }
  
  return (
    <div className="border rounded-lg p-4">
      <h4 className="text-sm font-medium text-muted-foreground mb-2">{label}</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">Current</span>
          <div className="p-3 rounded-md bg-red-50 border border-red-200">
            <p className="text-sm">{original || <span className="text-muted-foreground italic">Not set</span>}</p>
          </div>
        </div>
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">Proposed</span>
          <div className="p-3 rounded-md bg-green-50 border border-green-200">
            <p className="text-sm">{pending || <span className="text-muted-foreground italic">Not set</span>}</p>
          </div>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-1 text-xs text-blue-600">
        <IconArrowRight className="h-3 w-3" />
        <span>This field will be updated</span>
      </div>
    </div>
  );
}

export default function PendingChangesPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const projectId = params?.id || "";

  // State for moderation dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [moderationAction, setModerationAction] = useState<"approved" | "rejected" | null>(null);
  const [moderationNote, setModerationNote] = useState("");

  // Get project details
  const {
    data: project,
    isLoading,
    error,
  } = useGetProjectQuery(projectId);

  // Moderation mutation
  const [moderatePendingChanges, { isLoading: isModerating }] = useModeratePendingChangesMutation();

  // Fetch all categories to resolve names for pending category IDs (must be before any returns)
  const { data: categoriesData } = useFindAllCategoriesQuery({ limit: 100 });

  const pendingChanges = project?.pending_changes as Record<string, unknown> | null | undefined;

  // Extract pending changes values (safe to access even if undefined)
  const pendingName = pendingChanges?.name as string | undefined;
  const pendingDescription = pendingChanges?.description as string | undefined;
  const pendingRepository = pendingChanges?.repository as string | undefined;
  const pendingTechStack = pendingChanges?.tech_stack as string[] | undefined;
  const pendingVisibility = pendingChanges?.visibility as string | undefined;
  const pendingPreviewUrl = pendingChanges?.preview_url as string | undefined;
  const pendingCategoryIds = pendingChanges?.categoryIds as string[] | undefined;

  // Get current category IDs from project
  const currentCategoryIds = project?.categories?.map((c) => c.id) || [];

  // Check if categories actually changed (compare IDs as sorted arrays)
  const categoriesChanged = useMemo(() => {
    if (pendingCategoryIds === undefined) return false;
    const sortedCurrent = [...currentCategoryIds].sort();
    const sortedPending = [...pendingCategoryIds].sort();
    if (sortedCurrent.length !== sortedPending.length) return true;
    return sortedCurrent.some((id, index) => id !== sortedPending[index]);
  }, [currentCategoryIds, pendingCategoryIds]);

  // Get category names for pending category IDs
  const pendingCategoryNames = useMemo(() => {
    if (!pendingCategoryIds || !categoriesData?.items) return "";
    return pendingCategoryIds
      .map((id) => categoriesData.items.find((c) => c.id === id)?.name || id)
      .join(", ");
  }, [pendingCategoryIds, categoriesData?.items]);

  // Breadcrumb items
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Admin" },
    { label: "Moderation", href: "/dashboard/admin/moderation" },
    { label: project?.name || "Project" },
    { label: "Pending Changes" },
  ];

  // Action buttons for the header
  const actionButtons = (
    <div className="flex gap-2">
      <Button variant="outline" asChild>
        <Link href="/dashboard/admin/moderation">
          <IconArrowBack className="h-4 w-4 mr-2" />
          Back to Moderation
        </Link>
      </Button>
    </div>
  );

  if (isLoading) {
    return (
      <DashboardLayout
        breadcrumbItems={breadcrumbItems}
        title="Loading..."
        actions={actionButtons}
      >
        <div className="flex items-center justify-center h-64">
          <IconLoader className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !project) {
    return (
      <DashboardLayout
        breadcrumbItems={breadcrumbItems}
        title="Project Not Found"
        actions={actionButtons}
      >
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">
              The project you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.
            </p>
            <Button asChild>
              <Link href="/dashboard/admin/moderation">Go to Moderation</Link>
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  if (project.moderation_status !== ModerationStatus.CHANGES_PENDING || !pendingChanges) {
    return (
      <DashboardLayout
        breadcrumbItems={breadcrumbItems}
        title="No Pending Changes"
        actions={actionButtons}
      >
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">
              This project doesn&apos;t have any pending changes to review.
            </p>
            <Button asChild>
              <Link href="/dashboard/admin/moderation">Go to Moderation</Link>
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      breadcrumbItems={breadcrumbItems}
      title={`Pending Changes: ${project.name}`}
      actions={actionButtons}
    >
      <div className="flex flex-col gap-6">
        {/* Project Info Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">{project.name}</CardTitle>
                <CardDescription>
                  Reviewing changes submitted{" "}
                  {project.pending_changes_submitted_at
                    ? formatDistanceToNow(new Date(project.pending_changes_submitted_at), {
                        addSuffix: true,
                      })
                    : "recently"}
                </CardDescription>
              </div>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                Changes Pending Review
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Changes Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Changes Comparison</CardTitle>
            <CardDescription>
              Review the differences between the current approved version and the proposed changes.
              Fields highlighted in <span className="text-red-600">red</span> will be replaced with
              values highlighted in <span className="text-green-600">green</span>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ChangeField
              label="Project Name"
              original={project.name}
              pending={pendingName}
            />
            
            <ChangeField
              label="Description"
              original={project.description}
              pending={pendingDescription}
            />
            
            <ChangeField
              label="Repository"
              original={project.repository}
              pending={pendingRepository}
            />
            
            <ChangeField
              label="Preview URL"
              original={project.preview_url}
              pending={pendingPreviewUrl}
            />
            
            <ChangeField
              label="Visibility"
              original={project.visibility}
              pending={pendingVisibility}
            />
            
            {pendingTechStack !== undefined && (
              <ChangeField
                label="Tech Stack"
                original={project.tech_stack?.join(", ")}
                pending={pendingTechStack?.join(", ")}
              />
            )}
            
            {categoriesChanged && (
              <ChangeField
                label="Categories"
                original={project.categories?.map((c) => c.name).join(", ") || "No categories"}
                pending={pendingCategoryNames || "No categories"}
              />
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-end">
              <Button
                variant="outline"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => {
                  setModerationAction("rejected");
                  setModerationNote("");
                  setDialogOpen(true);
                }}
              >
                <IconX className="h-4 w-4 mr-2" />
                Reject Changes
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={() => {
                  setModerationAction("approved");
                  setModerationNote("");
                  setDialogOpen(true);
                }}
              >
                <IconCheck className="h-4 w-4 mr-2" />
                Approve Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Moderation Confirmation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {moderationAction === "approved" ? "Approve Changes" : "Reject Changes"}
            </DialogTitle>
            <DialogDescription>
              {moderationAction === "approved"
                ? `Are you sure you want to approve the changes for "${project.name}"? This will apply the pending changes to the project.`
                : `Are you sure you want to reject the changes for "${project.name}"? The pending changes will be discarded and the original approved version will remain.`}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">Note (optional)</label>
            <Textarea
              placeholder={
                moderationAction === "approved"
                  ? "Add any notes for approval..."
                  : "Please provide a reason for rejection..."
              }
              value={moderationNote}
              onChange={(e) => setModerationNote(e.target.value)}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={moderationAction === "approved" ? "default" : "destructive"}
              className={moderationAction === "approved" ? "bg-green-600 hover:bg-green-700" : ""}
              disabled={isModerating}
              onClick={async () => {
                if (!moderationAction) return;
                try {
                  await moderatePendingChanges({
                    projectId,
                    body: {
                      status: moderationAction,
                      note: moderationNote || undefined,
                    },
                  }).unwrap();
                  toast.success(
                    `Changes ${moderationAction === "approved" ? "approved" : "rejected"}`,
                    {
                      description: `"${project.name}" changes have been ${moderationAction}.`,
                    }
                  );
                  setDialogOpen(false);
                  router.push("/dashboard/admin/moderation");
                } catch (err) {
                  console.error("Failed to moderate changes:", err);
                  const error = err as { message?: string };
                  toast.error("Moderation failed", {
                    description: error?.message || "There was an error. Please try again.",
                  });
                }
              }}
            >
              {isModerating ? (
                <IconLoader className="h-4 w-4 animate-spin mr-2" />
              ) : moderationAction === "approved" ? (
                <IconCheck className="h-4 w-4 mr-2" />
              ) : (
                <IconX className="h-4 w-4 mr-2" />
              )}
              {moderationAction === "approved" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
