"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCreateLicenseMutation } from "@/store/features/licenses";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import DashboardLayout from "@/components/dashboard-layout";
import { BreadcrumbItem } from "@/components/breadcrumb";
import LicenseForm from "../components/license-form";
import { toast } from "sonner";
import { CreateLicenseDto } from "@/common/dtos";
import { getErrorMessage } from "@/utils/functions";

export default function CreateLicensePage() {
    const router = useRouter();
    const [createLicense, { isLoading, error, isSuccess }] =
        useCreateLicenseMutation();

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
        }
    };

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