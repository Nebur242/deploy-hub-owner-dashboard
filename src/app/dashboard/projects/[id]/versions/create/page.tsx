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
import { verifyVersionInGithubAccounts } from "@/services/github";

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

    // State for GitHub tag verification
    const [isVerifyingGithub, setIsVerifyingGithub] = useState(false);
    const [githubVerificationResult, setGithubVerificationResult] = useState<{
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
     * Handles the version change event and verifies the version against GitHub tags
     * 
     * Note: This function receives the already debounced version value from the VersionForm component.
     * The form component uses the useDebounce hook to prevent multiple API calls when the user
     * is typing quickly. This ensures we only make API calls when the user has stopped typing
     * for a specific amount of time (600ms).
     */
    const handleVersionChange = useCallback(async (version: string) => {
        // Skip API calls for very short or invalid versions
        if (!version || version.length < 3 || !hasConfigurations || allGithubAccounts.length === 0) {
            return;
        }

        // Validate it's roughly in semver format before making API calls
        const semverRegex = /^\d+(\.\d+)?(\.\d+)?/;
        if (!semverRegex.test(version)) {
            return;
        }

        // Reset verification state
        setIsVerifyingGithub(true);
        setGithubVerificationResult(null);

        try {
            // Since version is already debounced in the form component,
            // we can directly verify it against GitHub tags
            const result = await verifyVersionInGithubAccounts(allGithubAccounts, version);

            // Only update state if we're still on the same version
            // This prevents race conditions when typing quickly
            setGithubVerificationResult(result);
        } catch (err) {
            console.error("Error verifying version tag:", err);
            const error = err as Error;
            setGithubVerificationResult({
                isValid: false,
                foundInAccounts: [],
                message: `Error checking version tag: ${error.message}`
            });
        } finally {
            setIsVerifyingGithub(false);
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

        // Check if we should warn about missing GitHub tag
        const hasGithubAccounts = allGithubAccounts.length > 0;
        const needsTagWarning = hasGithubAccounts &&
            githubVerificationResult &&
            !githubVerificationResult.isValid &&
            !isVerifyingGithub;

        // If version doesn't exist as GitHub tag, confirm with user
        if (needsTagWarning) {
            const confirmCreate = window.confirm(
                `Warning: Version "${values.version}" doesn't exist as a tag in any GitHub repository. ` +
                `This may cause deployment issues later. Do you want to create it anyway?`
            );

            if (!confirmCreate) {
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
                        onVersionChange={handleVersionChange}
                        githubVerificationResult={githubVerificationResult}
                        isVerifyingGithub={isVerifyingGithub}
                    />
                )}
            </div>
        </DashboardLayout>
    );
}