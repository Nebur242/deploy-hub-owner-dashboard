"use client";

import { useState } from "react";
import {
  useGetModerationStatsQuery,
  useGetPendingModerationQuery,
  useModerateProjectMutation,
} from "@/store/features/projects";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  IconSearch,
  IconLoader,
  IconRefresh,
  IconCheck,
  IconX,
  IconEye,
  IconClock,
  IconCircleCheck,
  IconCircleX,
  IconFileDescription,
} from "@tabler/icons-react";
import Link from "next/link";
import DashboardLayout from "@/components/dashboard-layout";
import { BreadcrumbItem } from "@/components/breadcrumb";
import { toast } from "sonner";
import { Project } from "@/common/types";
import { ModerationStatus } from "@/common/enums/project";
import { formatDistanceToNow } from "date-fns";

export default function ModerationPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [moderationDialogOpen, setModerationDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [moderationAction, setModerationAction] = useState<
    "approved" | "rejected" | null
  >(null);
  const [moderationNote, setModerationNote] = useState("");

  // Fetch moderation stats
  const { data: stats, isLoading: isLoadingStats } =
    useGetModerationStatsQuery();

  // Fetch pending projects
  const {
    data: pendingData,
    isLoading: isLoadingPending,
    isFetching,
    refetch,
  } = useGetPendingModerationQuery({
    search: searchTerm || undefined,
    page: currentPage,
    limit: itemsPerPage,
  });

  // Moderate project mutation
  const [moderateProject, { isLoading: isModerating }] =
    useModerateProjectMutation();

  const projects = pendingData?.items || [];
  const totalProjects = pendingData?.meta?.totalItems || 0;
  const totalPages = pendingData?.meta?.totalPages || 1;

  const handleModerationClick = (
    project: Project,
    action: "approved" | "rejected"
  ) => {
    setSelectedProject(project);
    setModerationAction(action);
    setModerationNote("");
    setModerationDialogOpen(true);
  };

  const handleConfirmModeration = async () => {
    if (!selectedProject || !moderationAction) return;

    try {
      await moderateProject({
        projectId: selectedProject.id,
        body: {
          status: moderationAction,
          note: moderationNote || undefined,
        },
      }).unwrap();

      toast.success(
        `Project ${moderationAction === "approved" ? "approved" : "rejected"}`,
        {
          description: `"${selectedProject.name}" has been ${moderationAction}.`,
        }
      );

      setModerationDialogOpen(false);
      setSelectedProject(null);
      setModerationAction(null);
      setModerationNote("");
    } catch (error) {
      console.error("Failed to moderate project:", error);
      const err = error as { message?: string };
      toast.error("Moderation failed", {
        description:
          err?.message || "There was an error. Please try again.",
      });
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const getModerationStatusBadge = (status: ModerationStatus) => {
    switch (status) {
      case ModerationStatus.PENDING:
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <IconClock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case ModerationStatus.APPROVED:
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <IconCircleCheck className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case ModerationStatus.REJECTED:
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <IconCircleX className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      case ModerationStatus.DRAFT:
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            <IconFileDescription className="h-3 w-3 mr-1" />
            Draft
          </Badge>
        );
      case ModerationStatus.CHANGES_PENDING:
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <IconClock className="h-3 w-3 mr-1" />
            Changes Pending
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Breadcrumb items
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Admin" },
    { label: "Moderation" },
  ];

  // Action buttons for the header
  const actionButtons = (
    <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
      <IconRefresh
        className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`}
      />
      {isFetching ? "Refreshing..." : "Refresh"}
    </Button>
  );

  const isLoading = isLoadingStats || isLoadingPending;

  return (
    <DashboardLayout
      breadcrumbItems={breadcrumbItems}
      title="Project Moderation"
      actions={actionButtons}
    >
      <div className="flex flex-col gap-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <IconClock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingStats ? (
                  <IconLoader className="h-5 w-5 animate-spin" />
                ) : (
                  stats?.pending || 0
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Awaiting review
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Changes Pending</CardTitle>
              <IconClock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingStats ? (
                  <IconLoader className="h-5 w-5 animate-spin" />
                ) : (
                  stats?.changes_pending || 0
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Edits awaiting review
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <IconCircleCheck className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingStats ? (
                  <IconLoader className="h-5 w-5 animate-spin" />
                ) : (
                  stats?.approved || 0
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Live projects
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <IconCircleX className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingStats ? (
                  <IconLoader className="h-5 w-5 animate-spin" />
                ) : (
                  stats?.rejected || 0
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Not approved
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Drafts</CardTitle>
              <IconFileDescription className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingStats ? (
                  <IconLoader className="h-5 w-5 animate-spin" />
                ) : (
                  stats?.draft || 0
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Not submitted
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="flex gap-4 flex-col sm:flex-row">
          <div className="relative w-full sm:w-1/3">
            <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search pending projects..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">Project</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <div className="flex items-center justify-center">
                      <IconLoader className="h-6 w-6 animate-spin mr-2" />
                      Loading projects...
                    </div>
                  </TableCell>
                </TableRow>
              ) : projects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <div className="text-muted-foreground">
                      No pending projects found.
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                projects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{project.name}</span>
                        <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                          {project.description}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {project.owner_id}
                      </span>
                    </TableCell>
                    <TableCell>
                      {getModerationStatusBadge(project.moderation_status)}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {project.submitted_for_review_at
                          ? formatDistanceToNow(
                              new Date(project.submitted_for_review_at),
                              { addSuffix: true }
                            )
                          : "N/A"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/dashboard/projects/${project.id}`}>
                            <IconEye className="h-4 w-4" />
                            <span className="sr-only">View</span>
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() =>
                            handleModerationClick(project, "approved")
                          }
                        >
                          <IconCheck className="h-4 w-4" />
                          <span className="sr-only">Approve</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() =>
                            handleModerationClick(project, "rejected")
                          }
                        >
                          <IconX className="h-4 w-4" />
                          <span className="sr-only">Reject</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-2">
            <div className="text-sm text-muted-foreground">
              Showing {projects.length} of {totalProjects} projects
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <div className="text-sm">
                Page {currentPage} of {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Moderation Dialog */}
      <Dialog open={moderationDialogOpen} onOpenChange={setModerationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {moderationAction === "approved"
                ? "Approve Project"
                : "Reject Project"}
            </DialogTitle>
            <DialogDescription>
              {moderationAction === "approved"
                ? `Are you sure you want to approve "${selectedProject?.name}"? This will make the project visible to the public.`
                : `Are you sure you want to reject "${selectedProject?.name}"? The owner will be notified and can resubmit after making changes.`}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">
              Note (optional)
            </label>
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
            <Button
              variant="outline"
              onClick={() => setModerationDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant={moderationAction === "approved" ? "default" : "destructive"}
              onClick={handleConfirmModeration}
              disabled={isModerating}
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
