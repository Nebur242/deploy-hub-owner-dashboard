"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    useGetProjectQuery,
    useGetVersionsQuery,
    useGetConfigurationsQuery,
    useDeleteProjectMutation,
    useSubmitForReviewMutation,
} from "@/store/features/projects";
import { useGetDeploymentsQuery } from "@/store/features/deployments";
import { useGetProjectReviewsQuery } from "@/store/features/reviews";
import { DeploymentStatusBadge } from "../../deployments/components";
import {
    IconArrowBack,
    IconLoader,
    IconEdit,
    IconTrash,
    IconGitBranch,
    IconExternalLink,
    IconCode,
    IconServer,
    IconChevronRight,
    IconArrowRight,
    IconTerminal,
    IconSend,
    IconClock,
    IconCircleCheck,
    IconCircleX,
    IconFileDescription,
    IconStar,
    IconMessage,
    IconAlertCircle,
} from "@tabler/icons-react";
import Link from "next/link";
import DashboardLayout from "@/components/dashboard-layout";
import { BreadcrumbItem } from "@/components/breadcrumb";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Visibility, ModerationStatus } from "@/common/enums/project";
import { formatDate } from "@/utils/functions";
import { formatDistanceToNow } from "date-fns";

export default function ProjectPreviewPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const projectId = params?.id || '';
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [submitForReviewDialogOpen, setSubmitForReviewDialogOpen] = useState(false);

    // Get project details
    const { data: project, isLoading: isLoadingProject, error: projectError } = useGetProjectQuery(projectId);

    // Get project versions
    const { data: versions = [], isLoading: isLoadingVersions } = useGetVersionsQuery(projectId);

    // Get project configurations
    const { data: configurations = [] } = useGetConfigurationsQuery(projectId);

    // Get project deployments
    const {
        data: deploymentsData,
        isLoading: isLoadingDeployments
    } = useGetDeploymentsQuery({
        project_id: projectId,
        limit: 5,
        page: 1
    }, {
        refetchOnMountOrArgChange: true,
        refetchOnFocus: true,
        refetchOnReconnect: true,
        pollingInterval: 45000,
    });

    // Access the deployments items array
    const deployments = deploymentsData?.items || [];

    // Get project reviews
    const { data: reviewsData, isLoading: isLoadingReviews, error: reviewsError } = useGetProjectReviewsQuery({
        projectId,
        page: 1,
        limit: 5,
    });

    const reviews = reviewsData?.items || [];
    const totalReviews = reviewsData?.meta?.totalItems || reviewsData?.meta?.itemCount || reviews.length;
    const averageRating = reviewsData?.stats?.average_rating || (totalReviews > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0);

    // Check if project has any configurations
    const hasConfigurations = configurations && configurations.length > 0;

    // Delete project mutation
    const [deleteProject, { isLoading: isDeleting }] = useDeleteProjectMutation();

    // Submit for review mutation
    const [submitForReview, { isLoading: isSubmitting }] = useSubmitForReviewMutation();

    // Handle delete confirmation
    const handleConfirmDelete = async () => {
        try {
            await deleteProject(projectId).unwrap();

            toast.success("Project deleted", {
                description: `"${project?.name}" has been deleted successfully.`,
            });

            // Redirect to projects list
            router.push("/dashboard/projects");
        } catch (error) {
            console.error("Failed to delete project:", error);
            const err = error as { message?: string };
            toast.error("Delete failed", {
                description:
                    err?.message ||
                    "There was an error deleting the project. Please try again.",
            });
        } finally {
            setDeleteDialogOpen(false);
        }
    };

    // Handle submit for review confirmation
    const handleConfirmSubmitForReview = async () => {
        try {
            await submitForReview({ projectId }).unwrap();

            toast.success("Submitted for review", {
                description: `"${project?.name}" has been submitted for review. We'll notify you once it's reviewed.`,
            });

            setSubmitForReviewDialogOpen(false);
        } catch (error) {
            console.error("Failed to submit for review:", error);
            const err = error as { message?: string };
            toast.error("Submission failed", {
                description:
                    err?.message ||
                    "There was an error submitting for review. Please try again.",
            });
        }
    };

    // Get moderation status badge
    const getModerationStatusBadge = (status: ModerationStatus) => {
        switch (status) {
            case ModerationStatus.PENDING:
                return (
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        <IconClock className="h-3 w-3 mr-1" />
                        Pending Review
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
            case ModerationStatus.CHANGES_PENDING:
                return (
                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                        <IconAlertCircle className="h-3 w-3 mr-1" />
                        Changes Pending Review
                    </Badge>
                );
            case ModerationStatus.DRAFT:
            default:
                return (
                    <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                        <IconFileDescription className="h-3 w-3 mr-1" />
                        Draft
                    </Badge>
                );
        }
    };

    // Get moderation status description
    const getModerationStatusDescription = (status: ModerationStatus) => {
        switch (status) {
            case ModerationStatus.PENDING:
                return "Your project is under review. We'll notify you once it's approved.";
            case ModerationStatus.APPROVED:
                return "Your project is approved and visible to the public.";
            case ModerationStatus.REJECTED:
                return "Your project was not approved. Check the feedback and resubmit.";
            case ModerationStatus.CHANGES_PENDING:
                return "Your changes are pending review. The original approved version is still visible.";
            case ModerationStatus.DRAFT:
            default:
                return "Submit your project for review to make it visible on the marketplace.";
        }
    };

    // Check if project can be submitted for review
    const canSubmitForReview = project?.moderation_status === ModerationStatus.DRAFT || 
        project?.moderation_status === ModerationStatus.REJECTED;

    // Get the stable version if available
    const stableVersion = versions.find(v => v.is_stable);

    // Get the latest version if available
    const latestVersion = versions.find(v => v.is_latest);

    // Breadcrumb items
    const breadcrumbItems: BreadcrumbItem[] = [
        { label: "Projects", href: "/dashboard/projects" },
        { label: project?.name || "Project Details" },
    ];

    // Action buttons for the header
    const actionButtons = project && (
        <>
            <Button
                variant="outline"
                asChild
            >
                <Link href={`/dashboard/projects/${projectId}/edit`}>
                    <IconEdit className="h-4 w-4 mr-2" />
                    Edit Project
                </Link>
            </Button>
            <Button
                variant="destructive"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={isDeleting}
            >
                {isDeleting ? (
                    <>
                        <IconLoader className="h-4 w-4 mr-2 animate-spin" />
                        Deleting...
                    </>
                ) : (
                    <>
                        <IconTrash className="h-4 w-4 mr-2" />
                        Delete Project
                    </>
                )}
            </Button>
        </>
    );

    return (
        <DashboardLayout
            breadcrumbItems={breadcrumbItems}
            title={project ? project.name : "Project Details"}
            actions={actionButtons}
        >
            <div className="flex flex-col gap-6">
                {/* <Button
                    variant="outline"
                    asChild
                    className="w-fit"
                >
                    <Link href="/dashboard/projects">
                        <IconArrowBack className="h-4 w-4 mr-2" /> Back to Projects
                    </Link>
                </Button> */}

                {isLoadingProject ? (
                    <div className="flex items-center justify-center py-12">
                        <IconLoader className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : projectError ? (
                    <div className="flex items-center justify-center py-12">
                        <p className="text-destructive">
                            Error loading project. Please try again.
                        </p>
                    </div>
                ) : project ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Main Project Information */}
                        <div className="col-span-2 space-y-6">
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-2xl">{project.name}</CardTitle>
                                            <CardDescription>
                                                Created on {formatDate(project.created_at)}
                                            </CardDescription>
                                        </div>
                                        <Badge
                                            variant={
                                                project.visibility === Visibility.FEATURED
                                                    ? "default"
                                                    : "outline"
                                            }
                                            className={
                                                project.visibility === Visibility.PRIVATE
                                                    ? "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20"
                                                    : project.visibility === Visibility.FEATURED
                                                        ? "bg-primary"
                                                        : ""
                                            }
                                        >
                                            {project.visibility}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {project.image && (
                                        <div className="mb-4">
                                            <div className="relative w-full h-52 rounded-md overflow-hidden border border-muted">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={JSON.parse(project.image).url}
                                                    alt={project.name}
                                                    className="object-cover w-full h-full"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <h3 className="text-lg font-semibold mb-2">Description</h3>
                                        <p className="text-muted-foreground">{project.description}</p>
                                    </div>

                                    <Separator />

                                    <div>
                                        <h3 className="text-lg font-semibold mb-2">Tech Stack</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {project.tech_stack.map((tech) => (
                                                <Badge key={tech} variant="outline">
                                                    {tech}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>

                                    {project.categories && project.categories.length > 0 && (
                                        <>
                                            <Separator />
                                            <div>
                                                <h3 className="text-lg font-semibold mb-2">Categories</h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {project.categories.map((category) => (
                                                        <Badge key={category.id} variant="secondary">
                                                            {category.name}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {project.repository && (
                                        <>
                                            <Separator />
                                            <div>
                                                <h3 className="text-lg font-semibold mb-2">Repository</h3>
                                                <div className="flex items-center">
                                                    <a
                                                        href={project.repository}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-500 hover:underline flex items-center"
                                                    >
                                                        {project.repository}
                                                        <IconExternalLink className="h-4 w-4 ml-1" />
                                                    </a>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {project.preview_url && (
                                        <>
                                            <Separator />
                                            <div>
                                                <h3 className="text-lg font-semibold mb-2">Preview URL</h3>
                                                <div className="flex items-center">
                                                    <a
                                                        href={project.preview_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-500 hover:underline flex items-center"
                                                    >
                                                        {project.preview_url}
                                                        <IconExternalLink className="h-4 w-4 ml-1" />
                                                    </a>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Versions Table */}
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle>Versions</CardTitle>
                                        <Button asChild variant="outline" size="sm">
                                            <Link href={`/dashboard/projects/${projectId}/versions`}>
                                                <IconGitBranch className="h-4 w-4 mr-2" />
                                                View All Versions
                                            </Link>
                                        </Button>
                                    </div>
                                    <CardDescription>
                                        {versions.length === 0
                                            ? "No versions available for this project."
                                            : `${versions.length} version${versions.length !== 1 ? "s" : ""} available`}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {isLoadingVersions ? (
                                        <div className="flex items-center justify-center py-6">
                                            <IconLoader className="h-6 w-6 animate-spin text-primary" />
                                        </div>
                                    ) : versions.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-8 space-y-4">
                                            <p className="text-muted-foreground text-center">
                                                No versions have been created for this project yet.
                                            </p>
                                            <Button asChild>
                                                <Link href={`/dashboard/projects/${projectId}/versions/create`}>
                                                    Create First Version
                                                </Link>
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="rounded-md border">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Version</TableHead>
                                                        <TableHead>Status</TableHead>
                                                        <TableHead>Created</TableHead>
                                                        <TableHead className="text-right">Actions</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {/* Show only up to 5 recent versions */}
                                                    {versions.slice(0, 5).map((version) => (
                                                        <TableRow key={version.id}>
                                                            <TableCell className="font-medium">
                                                                {version.version}
                                                                {version.is_latest && (
                                                                    <Badge className="ml-2 bg-blue-500 text-white hover:bg-blue-600">
                                                                        Latest
                                                                    </Badge>
                                                                )}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge
                                                                    variant={version.is_stable ? "default" : "outline"}
                                                                    className={
                                                                        version.is_stable
                                                                            ? "bg-green-500 hover:bg-green-600"
                                                                            : "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20"
                                                                    }
                                                                >
                                                                    {version.is_stable ? "Stable" : "Unstable"}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell>
                                                                {formatDate(version.created_at)}
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    asChild
                                                                    className="text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50"
                                                                >
                                                                    <Link
                                                                        href={`/dashboard/projects/${projectId}/versions/${version.id}`}
                                                                    >
                                                                        View
                                                                    </Link>
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    )}
                                </CardContent>
                                {versions.length > 5 && (
                                    <CardFooter className="justify-center border-t pt-4">
                                        <Button asChild variant="outline">
                                            <Link href={`/dashboard/projects/${projectId}/versions`}>
                                                View All {versions.length} Versions
                                            </Link>
                                        </Button>
                                    </CardFooter>
                                )}
                            </Card>

                            {/* Deployments Card */}
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle>Deployments</CardTitle>
                                        {
                                            hasConfigurations && (
                                                <Button asChild variant="outline" size="sm">
                                                    <Link href={`/dashboard/projects/${projectId}/deployments`}>
                                                        <IconServer className="h-4 w-4 mr-2" />
                                                        View All Deployments
                                                    </Link>
                                                </Button>
                                            )
                                        }

                                    </div>
                                    <CardDescription>
                                        Recent deployments for this project
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {isLoadingDeployments ? (
                                        <div className="flex items-center justify-center py-6">
                                            <IconLoader className="h-6 w-6 animate-spin text-primary" />
                                        </div>
                                    ) : !hasConfigurations ? (
                                        <div className="flex flex-col items-center justify-center py-8 space-y-4">
                                            <p className="text-muted-foreground text-center">
                                                You need to create at least one configuration before you can deploy this project.
                                            </p>
                                            <Button asChild>
                                                <Link href={`/dashboard/projects/${projectId}/configurations/create`}>
                                                    <IconCode className="h-4 w-4 mr-2" />
                                                    Create Configuration
                                                </Link>
                                            </Button>
                                        </div>
                                    ) : deployments.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-8 space-y-4">
                                            <p className="text-muted-foreground text-center">
                                                This project doesn&apos;t have any deployments yet.
                                            </p>
                                            <Button asChild>
                                                <Link href={`/dashboard/deployments/create?projectId=${projectId}`}>
                                                    <IconServer className="h-4 w-4 mr-2" />
                                                    Deploy Project
                                                </Link>
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="rounded-md border">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Environment</TableHead>
                                                        <TableHead>Status</TableHead>
                                                        <TableHead>Created</TableHead>
                                                        <TableHead className="text-right">Actions</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {deployments.map((deployment) => (
                                                        <TableRow key={deployment.id}>
                                                            <TableCell>
                                                                <Badge variant="outline">
                                                                    {deployment.environment}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell>
                                                                <DeploymentStatusBadge status={deployment.status} />
                                                            </TableCell>
                                                            <TableCell>
                                                                {formatDistanceToNow(new Date(deployment.created_at), { addSuffix: true })}
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <div className="flex justify-end space-x-1">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        asChild
                                                                        className="text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50"
                                                                    >
                                                                        <Link href={`/dashboard/deployments/${deployment.id}`}>
                                                                            <IconArrowRight className="h-4 w-4 mr-1" />
                                                                            Details
                                                                        </Link>
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        asChild
                                                                        className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                                                    >
                                                                        <Link href={`/dashboard/deployments/${deployment.id}/logs`}>
                                                                            <IconTerminal className="h-4 w-4 mr-1" />
                                                                            Logs
                                                                        </Link>
                                                                    </Button>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    )}
                                </CardContent>
                                {deployments.length > 0 && (
                                    <CardFooter className="justify-center border-t pt-4">
                                        <Button asChild variant="outline">
                                            <Link href={`/dashboard/projects/${projectId}/deployments`}>
                                                View All Deployments
                                            </Link>
                                        </Button>
                                    </CardFooter>
                                )}
                            </Card>
                        </div>

                        {/* Project Status and Actions */}
                        <div className="space-y-6">
                            {/* Moderation Status Card */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Moderation Status</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium">Status</p>
                                            {getModerationStatusBadge(project.moderation_status)}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {getModerationStatusDescription(project.moderation_status)}
                                        </p>
                                    </div>

                                    {project.moderation_note && (
                                        <div className="p-3 bg-muted rounded-md">
                                            <p className="text-sm font-medium mb-1">Review Feedback</p>
                                            <p className="text-sm text-muted-foreground">
                                                {project.moderation_note}
                                            </p>
                                        </div>
                                    )}

                                    {project.submitted_for_review_at && (
                                        <div className="text-xs text-muted-foreground">
                                            Submitted {formatDistanceToNow(new Date(project.submitted_for_review_at), { addSuffix: true })}
                                        </div>
                                    )}

                                    {canSubmitForReview && (
                                        <Button
                                            className="w-full"
                                            onClick={() => setSubmitForReviewDialogOpen(true)}
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? (
                                                <IconLoader className="h-4 w-4 mr-2 animate-spin" />
                                            ) : (
                                                <IconSend className="h-4 w-4 mr-2" />
                                            )}
                                            {project.moderation_status === ModerationStatus.REJECTED
                                                ? "Resubmit for Review"
                                                : "Submit for Review"}
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Project Status</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium">Visibility</p>
                                        <Badge
                                            variant={
                                                project.visibility === Visibility.FEATURED
                                                    ? "default"
                                                    : "outline"
                                            }
                                            className={
                                                project.visibility === Visibility.PRIVATE
                                                    ? "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20"
                                                    : project.visibility === Visibility.FEATURED
                                                        ? "bg-primary"
                                                        : ""
                                            }
                                        >
                                            {project.visibility}
                                        </Badge>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {project.visibility === Visibility.PUBLIC
                                                ? "Available to all users."
                                                : project.visibility === Visibility.PRIVATE
                                                    ? "Only visible to you."
                                                    : "Featured on the marketplace."}
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-sm font-medium">Versions</p>
                                        <div className="flex space-x-2">
                                            <Badge variant="outline">{versions.length} Total</Badge>
                                            {stableVersion && (
                                                <Badge className="bg-green-500 hover:bg-green-600">
                                                    1 Stable
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    {stableVersion && (
                                        <div className="pt-2">
                                            <p className="text-sm font-medium">Stable Version</p>
                                            <p className="font-medium mt-1">
                                                {stableVersion.version}
                                                <span className="text-xs text-muted-foreground ml-2">
                                                    ({formatDate(stableVersion.created_at)})
                                                </span>
                                            </p>
                                        </div>
                                    )}

                                    {latestVersion && latestVersion.id !== stableVersion?.id && (
                                        <div className="pt-2">
                                            <p className="text-sm font-medium">Latest Version</p>
                                            <p className="font-medium mt-1">
                                                {latestVersion.version}
                                                <span className="text-xs text-muted-foreground ml-2">
                                                    ({formatDate(latestVersion.created_at)})
                                                </span>
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Actions</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <Button className="w-full" asChild>
                                        <Link href={`/dashboard/projects/${projectId}/versions/create`}>
                                            <IconGitBranch className="h-4 w-4 mr-2" />
                                            Create New Version
                                        </Link>
                                    </Button>

                                    {hasConfigurations ? (
                                        <Button className="w-full" asChild variant="default">
                                            <Link href={`/dashboard/deployments/create?projectId=${projectId}`}>
                                                <IconServer className="h-4 w-4 mr-2" />
                                                Deploy Project
                                            </Link>
                                        </Button>
                                    ) : (
                                        <Button className="w-full" asChild variant="default">
                                            <Link href={`/dashboard/projects/${projectId}/configurations/create`}>
                                                <IconCode className="h-4 w-4 mr-2" />
                                                Create Configuration
                                            </Link>
                                        </Button>
                                    )}

                                    <Button className="w-full" asChild variant="outline">
                                        <Link href={`/dashboard/projects/${projectId}/deployments`}>
                                            <IconChevronRight className="h-4 w-4 mr-2" />
                                            View Deployments
                                        </Link>
                                    </Button>

                                    {project.repository && (
                                        <Button
                                            variant="outline"
                                            className="w-full"
                                            asChild
                                        >
                                            <a
                                                href={project.repository}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                <IconCode className="h-4 w-4 mr-2" />
                                                View Source Code
                                            </a>
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Customer Reviews Card */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <IconMessage className="h-5 w-5" />
                                        Customer Reviews
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {isLoadingReviews ? (
                                        <div className="flex items-center justify-center py-4">
                                            <IconLoader className="h-6 w-6 animate-spin text-primary" />
                                        </div>
                                    ) : totalReviews === 0 ? (
                                        <p className="text-sm text-muted-foreground text-center py-4">
                                            No customer reviews yet
                                        </p>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-3">
                                                <div className="text-3xl font-bold">
                                                    {averageRating.toFixed(1)}
                                                </div>
                                                <div>
                                                    <div className="flex items-center">
                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                            <IconStar
                                                                key={star}
                                                                className={`h-4 w-4 ${
                                                                    averageRating >= star
                                                                        ? "fill-yellow-400 text-yellow-400"
                                                                        : "text-gray-300"
                                                                }`}
                                                            />
                                                        ))}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">
                                                        {totalReviews} review{totalReviews !== 1 ? "s" : ""}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                className="w-full"
                                                variant="outline"
                                                asChild
                                            >
                                                <Link href={`/dashboard/projects/${projectId}/reviews`}>
                                                    <IconChevronRight className="h-4 w-4 mr-2" />
                                                    View All Reviews
                                                </Link>
                                            </Button>
                                        </>
                                    )}
                                </CardContent>
                            </Card>

                            {project.licenses && project.licenses.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Available Licenses</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {project.licenses.map((license) => (
                                            <div key={license.id} className="p-3 border rounded-md">
                                                <div className="flex justify-between items-start">
                                                    <h4 className="font-semibold">{license.name}</h4>
                                                    <Badge>{license.currency} {license.price}</Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    {license.description}
                                                </p>
                                                <div className="mt-2">
                                                    <Button size="sm" className="w-full">
                                                        Purchase License
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                ) : null}
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the project &quot;
                            {project?.name}&quot; and all its versions. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-white"
                            onClick={handleConfirmDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <>
                                    <IconLoader className="h-4 w-4 mr-1 animate-spin" />{" "}
                                    Deleting...
                                </>
                            ) : (
                                "Delete"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Submit for Review Dialog */}
            <AlertDialog open={submitForReviewDialogOpen} onOpenChange={setSubmitForReviewDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Submit for Review</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to submit &quot;{project?.name}&quot; for review?
                            Once submitted, our team will review your project before it can be displayed on the marketplace.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmSubmitForReview}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <IconLoader className="h-4 w-4 mr-1 animate-spin" />{" "}
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <IconSend className="h-4 w-4 mr-1" />{" "}
                                    Submit for Review
                                </>
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </DashboardLayout>
    );
}