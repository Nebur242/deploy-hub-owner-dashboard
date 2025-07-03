"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCreateLicenseMutation } from "@/store/features/licenses";
import { useGetProjectsQuery } from "@/store/features/projects";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import DashboardLayout from "@/components/dashboard-layout";
import { BreadcrumbItem } from "@/components/breadcrumb";
import LicenseForm from "../components/license-form";
import { toast } from "sonner";
import { CreateLicenseDto } from "@/common/dtos";
import { getErrorMessage } from "@/utils/functions";
import { IconInfoCircle } from "@tabler/icons-react";

export default function CreateLicensePage() {
    const router = useRouter();
    const [createLicense, { isLoading, error, isSuccess }] =
        useCreateLicenseMutation();

    // Fetch projects to check if any exist
    const { data: projectsData, isLoading: isLoadingProjects } = useGetProjectsQuery({
        limit: 1, // We only need to check if any projects exist
    });

    const hasProjects = (projectsData?.items?.length || 0) > 0;

    // Redirect if no projects exist
    useEffect(() => {
        if (!isLoadingProjects && !hasProjects) {
            toast.error("No projects found", {
                description: "You need to create at least one project before creating a license."
            });
            router.push("/dashboard/projects/create");
        }
    }, [isLoadingProjects, hasProjects, router]);

    // Breadcrumb items
    const breadcrumbItems: BreadcrumbItem[] = [
        { label: "Licenses", href: "/dashboard/licenses" },
        { label: "Create New" },
    ];

    // Action buttons
    const actionButtons = (
        <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/dashboard/licenses")}
            className="flex items-center"
        >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Licenses
        </Button>
    );

    // Redirect after successful creation
    useEffect(() => {
        if (isSuccess) {
            // Show success toast
            toast.success("License created successfully");

            // Set a short timeout before redirecting to see the success state
            const timer = setTimeout(() => {
                router.push("/dashboard/licenses");
            }, 1500);

            return () => clearTimeout(timer);
        }
    }, [isSuccess, router]);

    const handleSubmit = async (data: CreateLicenseDto) => {
        try {
            await createLicense(data).unwrap();
        } catch (error) {
            console.error("Failed to create license:", error);
            toast.error(getErrorMessage(error) || "Failed to create license");
        }
    };

    // Show loading state while checking for projects
    if (isLoadingProjects) {
        return (
            <DashboardLayout
                breadcrumbItems={breadcrumbItems}
                title="Create License"
                actions={actionButtons}
            >
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
            </DashboardLayout>
        );
    }

    // If no projects, show a warning (this will be briefly shown before redirect)
    if (!hasProjects) {
        return (
            <DashboardLayout
                breadcrumbItems={breadcrumbItems}
                title="Create License"
                actions={actionButtons}
            >
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                    <div className="flex">
                        <IconInfoCircle className="h-5 w-5 text-yellow-500 mr-3" />
                        <div>
                            <h3 className="font-medium text-yellow-800">No projects found</h3>
                            <div className="text-yellow-700 mt-1">
                                <p>You need to create at least one project before you can create a license.</p>
                                <p className="mt-2">Redirecting to project creation page...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            breadcrumbItems={breadcrumbItems}
            title="Create License"
            actions={actionButtons}
        >
            <LicenseForm
                isEditing={false}
                onSubmit={handleSubmit}
                isLoading={isLoading}
                isSuccess={isSuccess}
                error={error ? { message: getErrorMessage(error) || 'An error occurred...' } : null}
            />
        </DashboardLayout>
    );
}