"use client";

import { useParams, useRouter } from "next/navigation";
import { useGetProjectQuery, useCreateVersionMutation } from "@/store/features/projects";
import { toast } from "sonner";
import { IconLoader, IconArrowBack } from "@tabler/icons-react";
import Link from "next/link";
import DashboardLayout from "@/components/dashboard-layout";
import { BreadcrumbItem } from "@/components/breadcrumb";
import { Button } from "@/components/ui/button";
import VersionForm, { VersionFormValues } from "../components/version-form";
import { getErrorMessage } from "@/utils/functions";

export default function CreateVersionPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const projectId = params?.id || "";

    // Get project details
    const { data: project, isLoading: isLoadingProject } = useGetProjectQuery(projectId);

    // Create version mutation
    const [createVersion, {
        isLoading,
        error,
        isSuccess,
    }] = useCreateVersionMutation();

    // Submit handler
    const onSubmit = async (values: VersionFormValues) => {
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

                {isLoadingProject ? (
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
                        error={{
                            message: getErrorMessage(error) || "An error occurred",
                        }}
                    />
                )}
            </div>
        </DashboardLayout>
    );
}