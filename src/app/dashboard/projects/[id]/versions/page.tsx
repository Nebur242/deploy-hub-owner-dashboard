"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import {
    useGetVersionsQuery,
    useGetProjectQuery,
    useDeleteVersionMutation,
    useSetVersionAsStableMutation,
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
import { ProjectVersion } from "@/common/types";
import {
    IconPlus,
    IconSearch,
    IconLoader,
    IconRefresh,
    IconTrash,
    IconStar,
    IconStarFilled,
    IconArrowBack,
    IconEye,
    IconAlertTriangle,
    IconEdit,
} from "@tabler/icons-react";
import Link from "next/link";
import DashboardLayout from "@/components/dashboard-layout";
import { BreadcrumbItem } from "@/components/breadcrumb";
import { toast } from "sonner";

export default function ProjectVersionsPage() {
    const params = useParams<{ id: string }>();
    const projectId = params?.id ?? "";
    const [searchTerm, setSearchTerm] = useState("");
    const [stabilityFilter, setStabilityFilter] = useState("all");

    // Delete dialog state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [versionToDelete, setVersionToDelete] = useState<ProjectVersion | null>(null);

    // Set stable dialog state
    const [stableDialogOpen, setStableDialogOpen] = useState(false);
    const [versionToSetStable, setVersionToSetStable] = useState<ProjectVersion | null>(null);

    // Get project details
    const { data: project, isLoading: isLoadingProject } = useGetProjectQuery(projectId);

    // Get versions
    const {
        data: versions = [],
        isLoading,
        isFetching,
        error,
        refetch,
    } = useGetVersionsQuery(projectId);

    // Delete version mutation
    const [deleteVersion, { isLoading: isDeleting }] = useDeleteVersionMutation();

    // Set version as stable mutation
    const [setVersionAsStable, { isLoading: isSetting }] = useSetVersionAsStableMutation();

    // Filter versions based on search term and stability filter
    const filteredVersions = versions.filter((version) => {
        const matchesSearch = version.version.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (version.releaseNotes && version.releaseNotes.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesStability = stabilityFilter === "all" ||
            (stabilityFilter === "stable" && version.isStable) ||
            (stabilityFilter === "unstable" && !version.isStable);

        return matchesSearch && matchesStability;
    });

    // Find current stable version (if any)
    const currentStableVersion = versions.find(v => v.isStable);

    // For handling delete confirmation
    const handleDeleteClick = (version: ProjectVersion) => {
        console.log("Delete version:", version);
        setVersionToDelete(version);
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!versionToDelete) return;

        try {
            // Call the RTK Query delete mutation
            await deleteVersion({
                projectId,
                versionId: versionToDelete.id,
            }).unwrap();

            // Show success toast
            toast.success("Version deleted", {
                description: `"${versionToDelete.version}" has been deleted successfully.`,
            });

            // Reset state
            setVersionToDelete(null);
            setDeleteDialogOpen(false);
        } catch (error) {
            console.error("Failed to delete version:", error);
            const err = error as { message?: string };
            // Show error toast
            toast.error("Delete failed", {
                description:
                    err?.message ||
                    "There was an error deleting the version. Please try again.",
            });
        }
    };

    // For handling set stable confirmation
    const handleSetStableClick = (version: ProjectVersion) => {
        setVersionToSetStable(version);
        setStableDialogOpen(true);
    };

    const handleConfirmSetStable = async () => {
        if (!versionToSetStable) return;

        try {
            // Call the RTK Query set stable mutation
            await setVersionAsStable({
                projectId,
                versionId: versionToSetStable.id,
            }).unwrap();

            // Show success toast
            toast.success("Version status updated", {
                description: `"${versionToSetStable.version}" has been set as the stable version.`,
            });

            // Reset state
            setVersionToSetStable(null);
            setStableDialogOpen(false);
        } catch (error) {
            console.error("Failed to set version as stable:", error);
            const err = error as { message?: string };
            // Show error toast
            toast.error("Update failed", {
                description:
                    err?.message ||
                    "There was an error updating the version status. Please try again.",
            });
        }
    };

    // Breadcrumb items
    const breadcrumbItems: BreadcrumbItem[] = [
        { label: "Projects", href: "/dashboard/projects" },
        { label: project?.name || "Project", href: `/dashboard/projects/${projectId}/edit` },
        { label: "Versions" },
    ];

    // Action buttons for the header
    const actionButtons = (
        <>
            <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
                <IconRefresh
                    className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`}
                />
                {isFetching ? "Refreshing..." : "Refresh"}
            </Button>
            <Button asChild>
                <Link href={`/dashboard/projects/${projectId}/versions/create`}>
                    <IconPlus className="h-4 w-4 mr-2" /> Create Version
                </Link>
            </Button>
        </>
    );

    return (
        <DashboardLayout
            breadcrumbItems={breadcrumbItems}
            title={`Versions${project ? ` - ${project.name}` : ''}`}
            actions={actionButtons}
        >
            <div className="flex flex-col gap-6">
                <div className="flex gap-4 flex-col sm:flex-row items-center mb-4">
                    <Button variant="outline" asChild className="w-full sm:w-auto">
                        <Link href={`/dashboard/projects/${projectId}`}>
                            <IconArrowBack className="h-4 w-4 mr-2" /> Back to Project
                        </Link>
                    </Button>

                    <div className="relative w-full sm:w-1/3">
                        <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search versions..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <Select
                        value={stabilityFilter}
                        onValueChange={(value) => setStabilityFilter(value)}
                    >
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Stability" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Versions</SelectItem>
                            <SelectItem value="stable">Stable</SelectItem>
                            <SelectItem value="unstable">Unstable</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {isLoading || isLoadingProject ? (
                    <div className="flex items-center justify-center py-12">
                        <IconLoader className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : error ? (
                    <div className="flex items-center justify-center py-12">
                        <p className="text-destructive">
                            Error loading versions. Please try again.
                        </p>
                    </div>
                ) : filteredVersions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-4 py-12">
                        <p className="text-muted-foreground">No versions found.</p>
                        <Link href={`/dashboard/projects/${projectId}/versions/create`}>
                            <Button>
                                <IconPlus className="mr-2 h-4 w-4" />
                                Create your first version
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Version</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Release Notes</TableHead>
                                    <TableHead>Commit Hash</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredVersions.map((version) => (
                                    <TableRow key={version.id}>
                                        <TableCell className="font-medium">
                                            {version.version}
                                            {version.isLatest && (
                                                <Badge className="ml-2 bg-blue-500 text-white hover:bg-blue-600">
                                                    Latest
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={version.isStable ? "default" : "outline"}
                                                className={
                                                    version.isStable
                                                        ? "bg-green-500 hover:bg-green-600"
                                                        : "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20"
                                                }
                                            >
                                                {version.isStable ? "Stable" : "Unstable"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="max-w-[300px] truncate">
                                            {version.releaseNotes || "No release notes"}
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">
                                            {version.commitHash
                                                ? version.commitHash.substring(0, 8)
                                                : "N/A"}
                                        </TableCell>
                                        <TableCell>
                                            {new Date(version.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end space-x-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    asChild
                                                    className="text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50"
                                                >
                                                    <Link
                                                        href={`/dashboard/projects/${projectId}/versions/${version.id}`}
                                                    >
                                                        <IconEye className="h-4 w-4 mr-1" /> View
                                                    </Link>
                                                </Button>

                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    asChild
                                                    className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                                >
                                                    <Link
                                                        href={`/dashboard/projects/${projectId}/versions/${version.id}/edit`}
                                                    >
                                                        <IconEdit className="h-4 w-4 mr-1" /> Edit
                                                    </Link>
                                                </Button>

                                                {!version.isStable && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-green-500 hover:text-green-700 hover:bg-green-50"
                                                        onClick={() => handleSetStableClick(version)}
                                                        disabled={isSetting && versionToSetStable?.id === version.id}
                                                    >
                                                        {isSetting && versionToSetStable?.id === version.id ? (
                                                            <>
                                                                <IconLoader className="h-4 w-4 mr-1 animate-spin" />{" "}
                                                                Setting...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <IconStar className="h-4 w-4 mr-1" /> Set Stable
                                                            </>
                                                        )}
                                                    </Button>
                                                )}
                                                {version.isStable && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-green-500 hover:text-green-700 hover:bg-green-50"
                                                        disabled={true}
                                                    >
                                                        <IconStarFilled className="h-4 w-4 mr-1" /> Stable
                                                    </Button>
                                                )}

                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => handleDeleteClick(version)}
                                                    disabled={
                                                        isDeleting && versionToDelete?.id === version.id || version.isStable
                                                    }
                                                >
                                                    {isDeleting &&
                                                        versionToDelete?.id === version.id ? (
                                                        <>
                                                            <IconLoader className="h-4 w-4 mr-1 animate-spin" />{" "}
                                                            Deleting...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <IconTrash className="h-4 w-4 mr-1" /> Delete
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the version &quot;
                            {versionToDelete?.version}&quot;. This action cannot be undone.
                            {versionToDelete?.isStable && (
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
                            onClick={handleConfirmDelete}
                            disabled={isDeleting || versionToDelete?.isStable}
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

            {/* Set Stable Confirmation Dialog */}
            <AlertDialog open={stableDialogOpen} onOpenChange={setStableDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center">
                            <IconAlertTriangle className="h-5 w-5 mr-2 text-amber-500" />
                            Set as Stable Version?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            You are about to set &quot;{versionToSetStable?.version}&quot; as the stable version.
                            {currentStableVersion ? (
                                <p className="mt-2">
                                    This will replace the current stable version &quot;{currentStableVersion.version}&quot;.
                                </p>
                            ) : null}
                            <p className="mt-2">
                                Stable versions are recommended for production use and cannot be deleted.
                            </p>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-green-600 text-white hover:bg-green-700"
                            onClick={handleConfirmSetStable}
                            disabled={isSetting}
                        >
                            {isSetting ? (
                                <>
                                    <IconLoader className="h-4 w-4 mr-1 animate-spin" />{" "}
                                    Setting...
                                </>
                            ) : (
                                "Confirm"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </DashboardLayout>
    );
}