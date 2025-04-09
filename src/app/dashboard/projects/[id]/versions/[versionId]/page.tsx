"use client";

import { useParams, useRouter } from "next/navigation";
import {
    useGetProjectQuery,
    useGetVersionQuery,
    useSetVersionAsStableMutation,
    useDeleteVersionMutation
} from "@/store/features/projects";
import {
    IconLoader,
    IconArrowBack,
    IconTrash,
    IconStar,
    IconExternalLink
} from "@tabler/icons-react";
import Link from "next/link";
import DashboardLayout from "@/components/dashboard-layout";
import { BreadcrumbItem } from "@/components/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
import { useState } from "react";

export default function VersionPreviewPage() {
    const router = useRouter();
    const params = useParams<{ id: string; versionId: string }>();
    const projectId = params?.id || "";
    const versionId = params?.versionId || "";
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    // Get project details
    const { data: project, isLoading: isLoadingProject } = useGetProjectQuery(projectId as string);

    // Get version details
    const {
        data: version,
        isLoading: isLoadingVersion,
        error: fetchError,
        refetch
    } = useGetVersionQuery({
        projectId: projectId,
        versionId: versionId,
    });

    // Set version as stable mutation
    const [setVersionAsStable, { isLoading: isSettingStable }] = useSetVersionAsStableMutation();

    // Delete version mutation
    const [deleteVersion, { isLoading: isDeleting }] = useDeleteVersionMutation();

    // Handle set as stable
    const handleSetStable = async () => {
        try {
            await setVersionAsStable({
                projectId: projectId as string,
                versionId: versionId as string,
            }).unwrap();

            toast.success("Version set as stable", {
                description: `Version "${version?.version}" is now marked as stable.`,
            });

            refetch();
        } catch (error) {
            console.error("Failed to set version as stable:", error);
            const err = error as { message?: string };
            toast.error("Action failed", {
                description: err?.message || "There was an error setting the version as stable. Please try again.",
            });
        }
    };

    // Handle delete
    const handleDelete = async () => {
        try {
            await deleteVersion({
                projectId: projectId as string,
                versionId: versionId as string,
            }).unwrap();

            toast.success("Version deleted", {
                description: `Version "${version?.version}" has been deleted successfully.`,
            });

            // Redirect to versions list
            router.push(`/dashboard/projects/${projectId}/versions`);
        } catch (error) {
            console.error("Failed to delete version:", error);
            const err = error as { message?: string };
            toast.error("Delete failed", {
                description: err?.message || "There was an error deleting the version. Please try again.",
            });
        } finally {
            setDeleteDialogOpen(false);
        }
    };

    // Format date for display
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    // Breadcrumb items
    const breadcrumbItems: BreadcrumbItem[] = [
        { label: "Projects", href: "/dashboard/projects" },
        { label: project?.name || "Project", href: `/dashboard/projects/${projectId}/edit` },
        { label: "Versions", href: `/dashboard/projects/${projectId}/versions` },
        { label: version?.version || "Version" },
    ];

    // Action buttons for the header
    const actionButtons = version && (
        <>
            {!version.isStable && (
                <Button
                    variant="outline"
                    onClick={handleSetStable}
                    disabled={isSettingStable}
                >
                    {isSettingStable ? (
                        <>
                            <IconLoader className="h-4 w-4 mr-2 animate-spin" />
                            Setting...
                        </>
                    ) : (
                        <>
                            <IconStar className="h-4 w-4 mr-2" />
                            Mark as Stable
                        </>
                    )}
                </Button>
            )}

            <Button
                variant="destructive"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={isDeleting || version.isStable}
            >
                {isDeleting ? (
                    <>
                        <IconLoader className="h-4 w-4 mr-2 animate-spin" />
                        Deleting...
                    </>
                ) : (
                    <>
                        <IconTrash className="h-4 w-4 mr-2" />
                        Delete
                    </>
                )}
            </Button>
        </>
    );

    return (
        <DashboardLayout
            breadcrumbItems={breadcrumbItems}
            title={`Version${version ? ` - ${version.version}` : ''}`}
            actions={actionButtons}
        >
            <div className="flex flex-col gap-6">
                <Button variant="outline" asChild className="w-fit">
                    <Link href={`/dashboard/projects/${projectId}/versions`}>
                        <IconArrowBack className="h-4 w-4 mr-2" /> Back to Versions
                    </Link>
                </Button>

                {isLoadingProject || isLoadingVersion ? (
                    <div className="flex items-center justify-center py-12">
                        <IconLoader className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : fetchError ? (
                    <div className="flex items-center justify-center py-12">
                        <p className="text-destructive">
                            Error loading version. Please try again.
                        </p>
                    </div>
                ) : version ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Main Version Information */}
                        <Card className="col-span-2">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-2xl flex items-center">
                                            {version.version}
                                            {version.isLatest && (
                                                <Badge className="ml-2 bg-blue-500 text-white hover:bg-blue-600">
                                                    Latest
                                                </Badge>
                                            )}
                                            {version.isStable && (
                                                <Badge className="ml-2 bg-green-500 hover:bg-green-600">
                                                    Stable
                                                </Badge>
                                            )}
                                        </CardTitle>
                                        <CardDescription>
                                            Created {version?.createdAt ? formatDate(version.createdAt) : 'Unknown date'}                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Version Info */}
                                <div>
                                    <h3 className="text-lg font-semibold mb-2">Release Notes</h3>
                                    {version.releaseNotes ? (
                                        <p className="whitespace-pre-line">
                                            {version.releaseNotes}
                                        </p>
                                    ) : (
                                        <p className="text-muted-foreground italic">
                                            No release notes provided for this version.
                                        </p>
                                    )}
                                </div>

                                <Separator />

                                {/* Commit Info */}
                                {version.commitHash && (
                                    <div>
                                        <h3 className="text-lg font-semibold mb-2">Commit Information</h3>
                                        <div className="bg-muted p-3 rounded-md font-mono text-sm">
                                            {version.commitHash}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Version Status and Actions */}
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Version Status</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium">Stability</p>
                                        <p>
                                            {version.isStable ? (
                                                <Badge className="bg-green-500 hover:bg-green-600">
                                                    Stable
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20">
                                                    Unstable
                                                </Badge>
                                            )}
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-sm font-medium">Latest Version</p>
                                        <p>
                                            {version.isLatest ? (
                                                <Badge className="bg-blue-500 text-white hover:bg-blue-600">
                                                    Latest
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline">
                                                    Not Latest
                                                </Badge>
                                            )}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Actions</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">

                                    {version.commitHash && (
                                        <Button
                                            variant="outline"
                                            className="w-full"
                                            asChild
                                        >
                                            <a
                                                href={`${project?.repository}/commit/${version.commitHash}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                <IconExternalLink className="h-4 w-4 mr-2" />
                                                View Commit
                                            </a>
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
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
                            This will permanently delete the version &quot;
                            {version?.version}&quot;. This action cannot be undone.
                            {version?.isStable && (
                                <p className="mt-2 text-red-500 font-semibold">
                                    Stable versions cannot be deleted. Please mark another version as stable first.
                                </p>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-white"
                            onClick={handleDelete}
                            disabled={isDeleting || version?.isStable}
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
        </DashboardLayout>
    );
}