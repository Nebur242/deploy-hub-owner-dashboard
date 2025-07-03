"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    useGetLicenseQuery,
    useUpdateLicenseMutation,
} from "@/store/features/licenses";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import DashboardLayout from "@/components/dashboard-layout";
import { BreadcrumbItem } from "@/components/breadcrumb";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CreateLicenseDto } from "@/common/dtos";
import LicenseForm from "../../components/license-form";
import { getErrorMessage } from "@/utils/functions";
import { toast } from "sonner";

export default function EditLicensePage() {
    const { id: licenseId } = useParams() as { id: string };
    const router = useRouter();

    // Avoid firing the query until we actually have a licenseId
    const skipLicenseFetch = !licenseId;

    const [initialValues, setInitialValues] = useState<
        CreateLicenseDto | undefined
    >(undefined);

    // RTK Query hooks
    const {
        data: license,
        isLoading: isFetchingLicense,
        error: fetchError,
        refetch,
    } = useGetLicenseQuery(licenseId, {
        skip: skipLicenseFetch || !licenseId
    });

    const [
        updateLicense,
        {
            isLoading: isUpdating,
            error: updateError,
            isSuccess,
            reset: resetUpdateState,
        },
    ] = useUpdateLicenseMutation();

    // Breadcrumb items
    const breadcrumbItems: BreadcrumbItem[] = [
        { label: "Licenses", href: "/dashboard/licenses" },
        { label: license ? `Edit ${license.name}` : "Edit License" },
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

    // Set the initial values when the license data is loaded
    useEffect(() => {
        if (license) {
            setInitialValues({
                name: license.name,
                description: license.description,
                price: license.price,
                currency: license.currency,
                deploymentLimit: license.deploymentLimit,
                duration: license.duration,
                features: license.features || [],
                projectIds: license.projects?.map(project => project.id) || [],
                status: license.status,
                popular: license.popular || false,
            });
        }
    }, [license]);

    // Clean up when component unmounts
    useEffect(() => {
        return () => {
            resetUpdateState();
        };
    }, [resetUpdateState]);

    // Redirect after successful update
    useEffect(() => {
        if (isSuccess) {
            toast.success("License updated successfully");

            const timer = setTimeout(() => {
                router.push("/dashboard/licenses");
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [isSuccess, router]);

    // Handle form submission
    const handleSubmit = async (data: CreateLicenseDto) => {
        try {
            await updateLicense({
                id: licenseId,
                body: data,
            }).unwrap();
        } catch (error) {
            console.error("Failed to update license:", error);
            toast.error("Failed to update license", {
                description: getErrorMessage(error) || "An error occurred. Please try again.",
            });
        }
    };

    // Function to retry loading if there was an error
    const handleRetryFetch = () => {
        refetch();
    };

    // Show loading state while fetching the license
    if (isFetchingLicense) {
        return (
            <DashboardLayout
                breadcrumbItems={breadcrumbItems}
                title="Edit License"
                actions={actionButtons}
            >
                <div className="flex justify-center items-center py-12">
                    <div className="text-center">
                        <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-primary" />
                        <p className="text-lg font-medium">Loading license data...</p>
                        <p className="text-sm text-muted-foreground mt-2">
                            Please wait while we retrieve the license information.
                        </p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    // Show error state if license fetching failed
    if (fetchError) {
        return (
            <DashboardLayout
                breadcrumbItems={breadcrumbItems}
                title="Edit License"
                actions={actionButtons}
            >
                <Alert variant="destructive" className="mb-6">
                    <AlertTitle className="text-lg font-semibold">
                        Failed to load license
                    </AlertTitle>
                    <AlertDescription className="mt-2">
                        <p>
                            We couldn&apos;t load the license information. This might be due
                            to a network issue or the license may no longer exist.
                        </p>
                        <div className="mt-4">
                            <Button onClick={handleRetryFetch} className="mr-2">
                                Try Again
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => router.push("/dashboard/licenses")}
                            >
                                Return to Licenses
                            </Button>
                        </div>
                    </AlertDescription>
                </Alert>
            </DashboardLayout>
        );
    }

    // If initialValues is not set yet, return null
    if (!initialValues) {
        return null;
    }

    return (
        <DashboardLayout
            breadcrumbItems={breadcrumbItems}
            title={`Edit: ${license?.name}`}
            actions={actionButtons}
        >
            <div className="space-y-8">
                {/* License Form */}
                <LicenseForm
                    isEditing={true}
                    initialData={initialValues}
                    onSubmit={handleSubmit}
                    isLoading={isUpdating}
                    isSuccess={isSuccess}
                    error={updateError ? {
                        message: getErrorMessage(updateError) || "An error occurred",
                    } : null}
                />

                {/* Purchase History could go here, similar to Configuration section in Project edit */}
                {/* The view-only license details page would need to be created separately */}
            </div>
        </DashboardLayout>
    );
}