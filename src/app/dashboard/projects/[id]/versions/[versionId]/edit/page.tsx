"use client";

import { useParams, useRouter } from "next/navigation";
import {
    useGetProjectQuery,
    useGetVersionQuery,
    useUpdateVersionMutation,
    useGetConfigurationsQuery
} from "@/store/features/projects";
import { toast } from "sonner";
import { IconLoader, IconArrowBack } from "@tabler/icons-react";
import Link from "next/link";
import DashboardLayout from "@/components/dashboard-layout";
import { BreadcrumbItem } from "@/components/breadcrumb";
import { Button } from "@/components/ui/button";
import VersionForm, { VersionFormValues } from "../../components/version-form";
import { getErrorMessage } from "@/utils/functions";
import { useEffect, useState, useCallback, useMemo } from "react";
import { verifyVersionInGithubAccounts } from "@/services/github";

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
        project_id: projectId,
        version_id: versionId
    });

    // Get configurations to check GitHub accounts
    const { data: configurations = [], isLoading: isLoadingConfigurations } = useGetConfigurationsQuery(projectId);

    // Update version mutation
    const [updateVersion, {
        isLoading,
        error,
        isSuccess,
    }] = useUpdateVersionMutation();

    // State for GitHub tag verification
    const [isVerifyingGithub, setIsVerifyingGithub] = useState(false);
    const [githubVerificationResult, setGithubVerificationResult] = useState<{
        isValid: boolean;
        foundInAccounts: string[];
        message: string;
    } | null>(null);

    // Get all GitHub accounts from configurations
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
     * Verifies if a version string exists as a tag in the connected GitHub repositories
     * 
     * Note: When used with the VersionForm component, this function receives the debounced 
     * version value, preventing excessive API calls during user input. The debouncing is
     * handled in the VersionForm component using the useDebounce hook.
     */
    const verifyVersionTag = useCallback(async (versionStr: string) => {
        // Skip API calls for very short or empty versions
        if (!versionStr || versionStr.length < 3 || allGithubAccounts.length === 0) {
            return;
        }

        // Validate it's roughly in semver format before making API calls
        const semverRegex = /^\d+(\.\d+)?(\.\d+)?/;
        if (!semverRegex.test(versionStr)) {
            return;
        }

        setIsVerifyingGithub(true);
        setGithubVerificationResult(null);

        try {
            // Version is already debounced in the form component
            // Verify version against GitHub tags
            const result = await verifyVersionInGithubAccounts(allGithubAccounts, versionStr);

            // Only update if this is still the current version
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
    }, [allGithubAccounts]);

    // Check version tag when version data is loaded
    useEffect(() => {
        if (version && version.version && allGithubAccounts.length > 0) {
            verifyVersionTag(version.version);
        }
    }, [version, allGithubAccounts, verifyVersionTag]);

    // Submit handler
    const onSubmit = async (values: VersionFormValues) => {
        try {
            // Call the RTK Query update mutation - only update allowed fields
            await updateVersion({
                project_id: projectId,
                id: versionId,
                body: {
                    release_notes: values.release_notes || "",
                    commit_hash: values.commit_hash
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

    const isLoading_Data = isLoadingProject || isLoadingVersion || isLoadingConfigurations;

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

                {isLoading_Data ? (
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
                                release_notes: version.release_notes || "",
                                commit_hash: version.commit_hash || "",
                                is_stable: version.is_stable || false
                            } : null}
                            onSubmit={onSubmit}
                            isLoading={isLoading}
                            isSuccess={isSuccess}
                            error={error ? {
                                message: getErrorMessage(error) || "An error occurred while updating the version.",
                            } : null}
                            configurations={configurations}
                            githubVerificationResult={githubVerificationResult}
                            isVerifyingGithub={isVerifyingGithub}
                        />
                    </>
                )}
            </div>
        </DashboardLayout>
    );
}
