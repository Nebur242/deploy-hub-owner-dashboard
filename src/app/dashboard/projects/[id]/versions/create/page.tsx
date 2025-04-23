"use client";

import { useParams, useRouter } from "next/navigation";
import { useGetProjectQuery, useCreateVersionMutation, useGetConfigurationsQuery } from "@/store/features/projects";
import { toast } from "sonner";
import { IconLoader, IconArrowBack, IconAlertTriangle } from "@tabler/icons-react";
import Link from "next/link";
import DashboardLayout from "@/components/dashboard-layout";
import { BreadcrumbItem } from "@/components/breadcrumb";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import VersionForm, { VersionFormValues } from "../components/version-form";
import { getErrorMessage } from "@/utils/functions";

export default function CreateVersionPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const projectId = params?.id || "";

    // Get project details
    const { data: project, isLoading: isLoadingProject } = useGetProjectQuery(projectId);

    // Get configurations for this project
    const { data: configurations = [], isLoading: isLoadingConfigurations } = useGetConfigurationsQuery(projectId);

    // Create version mutation
    const [createVersion, {
        isLoading,
        error,
        isSuccess,
    }] = useCreateVersionMutation();

    // Check if project has any configurations
    const hasConfigurations = configurations?.length > 0;

    // Submit handler
    const onSubmit = async (values: VersionFormValues) => {
        // Block version creation if no configurations exist
        if (!hasConfigurations) {
            toast.error("Configuration required", {
                description: "You need to create a configuration before creating a version.",
            });
            return;
        }

        try {
            // Call the RTK Query create mutation
            await createVersion({
                projectId,
                body: values,
            }).unwrap();

            // Show success toast
            toast.success("Version created", {
                description: `Version "${values.version}" has been created successfully.`,
            });

            // Redirect to versions list
            router.push(`/dashboard/projects/${projectId}/versions`);
        } catch (error) {
            console.error("Failed to create version:", error);
            const err = error as { message?: string };
            // Show error toast
            toast.error("Creation failed", {
                description:
                    err?.message ||
                    "There was an error creating the version. Please try again.",
            });
        }
    };

    // Breadcrumb items
    const breadcrumbItems: BreadcrumbItem[] = [
        { label: "Projects", href: "/dashboard/projects" },
        { label: project?.name || "Project", href: `/dashboard/projects/${projectId}/edit` },
        { label: "Versions", href: `/dashboard/projects/${projectId}/versions` },
        { label: "Create" },
    ];

    const isLoading_Data = isLoadingProject || isLoadingConfigurations;

    return (
        <DashboardLayout
            breadcrumbItems={breadcrumbItems}
            title={`Create Version${project ? ` - ${project.name}` : ''}`}
        >
            <div className="flex flex-col gap-6">
                <Button variant="outline" asChild className="w-fit">
                    <Link href={`/dashboard/projects/${projectId}/versions`}>
                        <IconArrowBack className="h-4 w-4 mr-2" /> Back to Versions
                    </Link>
                </Button>

                {!isLoading_Data && !hasConfigurations && (
                    <Alert variant="destructive">
                        <IconAlertTriangle className="h-4 w-4" />
                        <AlertTitle>Configuration Required</AlertTitle>
                        <AlertDescription>
                            You cannot create a version without a configuration.
                            <div className="mt-2">
                                <Button variant="outline" asChild>
                                    <Link href={`/dashboard/projects/${projectId}/configurations/create`}>
                                        Create Configuration
                                    </Link>
                                </Button>
                            </div>
                        </AlertDescription>
                    </Alert>
                )}

                {isLoading_Data ? (
                    <div className="flex items-center justify-center py-12">
                        <IconLoader className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <VersionForm
                        isEditing={false}
                        initialData={null}
                        onSubmit={onSubmit}
                        isLoading={isLoading}
                        isSuccess={isSuccess}
                        error={error ? {
                            message: getErrorMessage(error) || "An error occurred",
                        } : null}
                        disabled={!hasConfigurations}
                    />
                )}
            </div>
        </DashboardLayout>
    );
}