"use client";

import { useParams, useRouter } from "next/navigation";
import {
    useGetProjectQuery,
    useGetVersionQuery,
    useUpdateVersionMutation
} from "@/store/features/projects";
import { toast } from "sonner";
import { IconLoader, IconArrowBack } from "@tabler/icons-react";
import Link from "next/link";
import DashboardLayout from "@/components/dashboard-layout";
import { BreadcrumbItem } from "@/components/breadcrumb";
import { Button } from "@/components/ui/button";
import VersionForm, { VersionFormValues } from "../../components/version-form";
import { getErrorMessage } from "@/utils/functions";

export default function UpdateVersionPage() {
    const router = useRouter();
    const params = useParams<{ id: string; versionId: string }>();
    const projectId = params?.id || "";
    const versionId = params?.versionId || "";

    // Get project details
    const { data: project, isLoading: isLoadingProject } = useGetProjectQuery(projectId);

    // Get version details
    const {
        data: version,
        isLoading: isLoadingVersion
    } = useGetVersionQuery({
        projectId,
        versionId
    });

    // Update version mutation
    const [updateVersion, {
        isLoading,
        error,
        isSuccess,
    }] = useUpdateVersionMutation();

    // Submit handler
    const onSubmit = async (values: VersionFormValues) => {
        try {
            // Call the RTK Query update mutation - only update allowed fields
            await updateVersion({
                projectId,
                id: versionId,
                body: {
                    releaseNotes: values.releaseNotes || "",
                    commitHash: values.commitHash
                    // version and isStable fields are not included as they can't be modified
                },
            }).unwrap();

            // Show success toast
            toast.success("Version updated", {
                description: `Version details have been updated successfully.`,
            });

            // Redirect to versions list
            router.push(`/dashboard/projects/${projectId}/versions`);
        } catch (error) {
            console.error("Failed to update version:", error);
            const err = error as { message?: string };
            // Show error toast
            toast.error("Update failed", {
                description:
                    err?.message ||
                    "There was an error updating the version. Please try again.",
            });
        }
    };

    // Breadcrumb items
    const breadcrumbItems: BreadcrumbItem[] = [
        { label: "Projects", href: "/dashboard/projects" },
        { label: project?.name || "Project", href: `/dashboard/projects/${projectId}/edit` },
        { label: "Versions", href: `/dashboard/projects/${projectId}/versions` },
        { label: `Edit ${version?.version || "Version"}` },
    ];

    if (!version && !isLoadingVersion) {
        // Redirect to versions list if version is not found
        router.push(`/dashboard/projects/${projectId}/versions`);
        return null;
    }


    return (
        <DashboardLayout
            breadcrumbItems={breadcrumbItems}
            title={`Edit Version${version ? ` - ${version.version}` : ''}${project ? ` (${project.name})` : ''}`}
        >
            <div className="flex flex-col gap-6">
                <Button variant="outline" asChild className="w-fit">
                    <Link href={`/dashboard/projects/${projectId}/versions`}>
                        <IconArrowBack className="h-4 w-4 mr-2" /> Back to Versions
                    </Link>
                </Button>

                {(isLoadingProject || isLoadingVersion) ? (
                    <div className="flex items-center justify-center py-12">
                        <IconLoader className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <>
                        {/* Note about editable fields */}
                        <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-4">
                            <h3 className="text-sm font-medium text-amber-800">Editing Version {version?.version}</h3>
                            <p className="text-sm text-amber-700 mt-1">
                                Only the commit hash and release notes can be modified for an existing version.
                                Version number and stability status cannot be changed after creation.
                            </p>
                        </div>

                        <VersionForm
                            isEditing={true}
                            initialData={version ? {
                                ...version,
                                // Make sure the form knows these fields are read-only
                                // by providing them explicitly
                                id: version.id,
                                version: version.version || "",
                                releaseNotes: version.releaseNotes || "",
                                commitHash: version.commitHash || "",
                                isStable: version.isStable || false
                            } : null}
                            onSubmit={onSubmit}
                            isLoading={isLoading}
                            isSuccess={isSuccess}
                            error={{
                                message: getErrorMessage(error) || "An error occurred while updating the version.",
                            }}
                        />
                    </>
                )}
            </div>
        </DashboardLayout>
    );
}