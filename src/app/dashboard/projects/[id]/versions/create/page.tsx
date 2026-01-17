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
import { useState, useCallback, useMemo } from "react";
import { verifyBranchInGithubAccounts } from "@/services/github";

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

    // State for branch/tag verification
    const [isVerifyingBranch, setIsVerifyingBranch] = useState(false);
    const [branchVerificationResult, setBranchVerificationResult] = useState<{
        isValid: boolean;
        foundInAccounts: string[];
        message: string;
    } | null>(null);

    // Check if project has any configurations
    const hasConfigurations = configurations?.length > 0;

    // Get all GitHub accounts from project configurations
    // Use useMemo to prevent recreating this array on every render
    const allGithubAccounts = useMemo(() => configurations.flatMap(config =>
        (config.github_accounts || []).map(account => ({
            username: account.username,
            access_token: account.access_token,
            repository: account.repository,
            workflow_file: account.workflow_file
        }))
    ), [configurations]);

    /**
     * Handles the branch change event and verifies the branch/tag against GitHub
     */
    const handleBranchChange = useCallback(async (branch: string) => {
        // Skip API calls for very short values
        if (!branch || branch.length < 1 || !hasConfigurations || allGithubAccounts.length === 0) {
            setBranchVerificationResult(null);
            return;
        }

        // Reset verification state
        setIsVerifyingBranch(true);
        setBranchVerificationResult(null);

        try {
            const result = await verifyBranchInGithubAccounts(allGithubAccounts, branch);
            setBranchVerificationResult(result);
        } catch (err) {
            console.error("Error verifying branch:", err);
            const error = err as Error;
            setBranchVerificationResult({
                isValid: false,
                foundInAccounts: [],
                message: `Error checking branch/tag: ${error.message}`
            });
        } finally {
            setIsVerifyingBranch(false);
        }
    }, [hasConfigurations, allGithubAccounts]);

    // Submit handler
    const onSubmit = async (values: VersionFormValues) => {
        // Block version creation if no configurations exist
        if (!hasConfigurations) {
            toast.error("Configuration required", {
                description: "You need to create a configuration before creating a version.",
            });
            return;
        }

        // Block submission if branch is provided but doesn't exist in GitHub
        const hasGithubAccounts = allGithubAccounts.length > 0;
        if (values.branch && hasGithubAccounts) {
            // Still verifying - block submission
            if (isVerifyingBranch) {
                toast.error("Verification in progress", {
                    description: "Please wait for branch verification to complete.",
                });
                return;
            }

            // Branch doesn't exist - block submission
            if (branchVerificationResult && !branchVerificationResult.isValid) {
                toast.error("Invalid branch", {
                    description: `Branch "${values.branch}" does not exist in any connected GitHub repository. Please enter a valid branch or tag name.`,
                });
                return;
            }

            // Branch verification hasn't been done yet - block and request verification
            if (!branchVerificationResult) {
                toast.error("Branch not verified", {
                    description: "Please wait for the branch to be verified before creating the version.",
                });
                return;
            }
        }

        try {
            // Call the RTK Query create mutation
            await createVersion({
                project_id: projectId,
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
                        configurations={configurations}
                        onBranchChange={handleBranchChange}
                        branchVerificationResult={branchVerificationResult}
                        isVerifyingBranch={isVerifyingBranch}
                    />
                )}
            </div>
        </DashboardLayout>
    );
}