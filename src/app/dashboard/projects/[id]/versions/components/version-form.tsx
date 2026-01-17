"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { useDebounce } from "@/hooks/use-debounce";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { IconLoader } from "@tabler/icons-react";
import { SuccessAlert, ErrorAlert } from "@/components/ui/alerts";
import { ProjectVersion, ProjectConfiguration } from "@/common/types";
import { IconAlertTriangle, IconBrandGithub, IconCheck } from "@tabler/icons-react";

// Form schema validation
const formSchema = z.object({
    version: z.string()
        .min(1, "Version is required")
        .regex(
            /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/,
            "Version must follow semantic versioning format (X.Y.Z)"
        ),
    branch: z.string().min(1, "Branch or tag is required"),
    release_notes: z.string().optional(),
    commit_hash: z.string().optional(),
    is_stable: z.boolean(),
});

export type VersionFormValues = z.infer<typeof formSchema>;

interface VersionFormProps {
    isEditing: boolean;
    initialData: ProjectVersion | null;
    onSubmit: (values: VersionFormValues) => Promise<void>;
    isLoading: boolean;
    isSuccess: boolean;
    error: { message: string } | null;
    disabled?: boolean;
    configurations?: ProjectConfiguration[];
    onBranchChange?: (branch: string) => void;
    branchVerificationResult?: {
        isValid: boolean;
        foundInAccounts: string[];
        message: string;
    } | null;
    isVerifyingBranch?: boolean;
}

export default function VersionForm({
    isEditing,
    initialData,
    onSubmit,
    isLoading,
    isSuccess,
    error,
    disabled = false,
    configurations = [],
    onBranchChange,
    branchVerificationResult,
    isVerifyingBranch = false,
}: VersionFormProps) {
    const [submitAttempted, setSubmitAttempted] = useState(false);

    // Initialize form with default values
    const form = useForm<VersionFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: initialData || {
            version: "",
            branch: "",
            release_notes: "",
            commit_hash: "",
            is_stable: false,
        },
    });

    // Check for GitHub configurations
    const hasGithubConfigurations = configurations.some(
        config => config.github_accounts && config.github_accounts.length > 0
    );

    // Watch branch changes from the form input
    const branchValue = form.watch("branch");

    // Debounce the branch value to prevent multiple API calls
    const debouncedBranch = useDebounce(branchValue || "", 600);

    // Track if this is the first render to prevent unnecessary API calls
    const [isInitialBranchRender, setIsInitialBranchRender] = useState(true);

    // Call onBranchChange only when the debounced branch changes
    useEffect(() => {
        // Skip the first call with empty values to prevent unnecessary API calls on mount
        if (isInitialBranchRender) {
            setIsInitialBranchRender(false);
            return;
        }

        if (debouncedBranch && onBranchChange && !isEditing) {
            // The parent component will receive the debounced branch
            // and can use it to verify against GitHub branches/tags
            onBranchChange(debouncedBranch);
        }
    }, [debouncedBranch, onBranchChange, isEditing, isInitialBranchRender]);

    // Populate form when editing and initial data is available
    useEffect(() => {
        if (isEditing && initialData) {
            form.reset({
                version: initialData.version,
                branch: initialData.branch || "",
                release_notes: initialData.release_notes || "",
                commit_hash: initialData.commit_hash || "",
                is_stable: initialData.is_stable,
            });
        }
    }, [isEditing, initialData, form]);

    // Handle form submission
    const handleSubmit = async (values: VersionFormValues) => {
        setSubmitAttempted(true);
        await onSubmit(values);
    };

    return (
        <div className="space-y-6">
            {/* Success Alert */}
            {isSuccess && <SuccessAlert isEditing={isEditing} className="mb-6" />}

            {/* Error Alert */}
            {submitAttempted && error && (
                <ErrorAlert
                    isEditing={isEditing}
                    message={error.message}
                    className="mb-6"
                />
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Basic Information */}
                <Card className="p-6 col-span-2">
                    <h3 className="text-lg font-semibold mb-4">Version Information</h3>
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(handleSubmit)}
                            className="space-y-6"
                        >
                            <FormField
                                control={form.control}
                                name="version"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Version Number</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="e.g. 1.0.0"
                                                {...field}
                                                disabled={disabled || isEditing || isLoading || isSuccess}
                                                className={isEditing ? "bg-gray-100" : disabled ? "bg-gray-100 opacity-70" : ""}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            {isEditing
                                                ? "Version number cannot be modified after creation."
                                                : "Use semantic versioning format (X.Y.Z) where X is major, Y is minor, and Z is patch version"
                                            }
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="branch"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Branch or Tag</FormLabel>
                                        <div className="flex items-center space-x-2">
                                            <FormControl>
                                                <Input
                                                    placeholder="e.g. main, develop, v1.0.0"
                                                    {...field}
                                                    disabled={disabled || isEditing || isLoading || isSuccess}
                                                    className={isEditing ? "bg-gray-100" : disabled ? "bg-gray-100 opacity-70" : ""}
                                                />
                                            </FormControl>
                                            {!isEditing && hasGithubConfigurations && branchValue && (
                                                <div className="flex items-center text-xs text-muted-foreground">
                                                    <IconBrandGithub className="h-3 w-3 mr-1" />
                                                    Branch/Tag verification
                                                </div>
                                            )}
                                        </div>
                                        <FormDescription>
                                            {isEditing
                                                ? "Branch or tag cannot be modified after creation."
                                                : "Enter a branch name (e.g., main, develop) or a tag that exists in your GitHub repository. This will be used during deployment instead of the version tag."
                                            }
                                        </FormDescription>
                                        {/* Branch Verification Status */}
                                        {!isEditing && hasGithubConfigurations && branchValue && (
                                            <div className="mt-2">
                                                {isVerifyingBranch ? (
                                                    <div className="flex items-center text-blue-600 text-sm">
                                                        <IconLoader className="h-3 w-3 mr-1 animate-spin" />
                                                        Verifying branch/tag...
                                                    </div>
                                                ) : branchVerificationResult && (
                                                    branchVerificationResult.isValid ? (
                                                        <div className="flex items-center text-green-600 text-sm">
                                                            <IconCheck className="h-3 w-3 mr-1" />
                                                            {branchVerificationResult.message}
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center text-red-600 text-sm">
                                                            <IconAlertTriangle className="h-3 w-3 mr-1" />
                                                            {branchVerificationResult.message}
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        )}
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="commit_hash"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Commit Hash</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="e.g. 8f4b8a1c"
                                                {...field}
                                                disabled={disabled || isLoading || isSuccess}
                                                className={isEditing ? "border-blue-300 focus-visible:ring-blue-400" : disabled ? "bg-gray-100 opacity-70" : ""}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            The git commit hash associated with this version {isEditing && "(editable)"}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="release_notes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Release Notes</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Describe the changes in this version..."
                                                className={`min-h-[120px] ${isEditing ? "border-blue-300 focus-visible:ring-blue-400" : disabled ? "bg-gray-100 opacity-70" : ""}`}
                                                {...field}
                                                disabled={disabled || isLoading || isSuccess}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Provide details about what changed in this version {isEditing && "(editable)"}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </form>
                    </Form>
                </Card>

                {/* Right Column */}
                <div className="space-y-6">
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold">Version Settings</h3>
                        <Form {...form}>
                            <div className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="is_stable"
                                    render={({ field }) => (
                                        <FormItem>
                                            <div className="space-y-2">
                                                <FormLabel>Stability Status</FormLabel>
                                                <FormDescription>
                                                    Mark this version as a stable release
                                                </FormDescription>
                                            </div>
                                            <div className="pt-2">
                                                <div className="flex items-center space-x-2">
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                            disabled={disabled || isEditing || isLoading || isSuccess}
                                                            className={isEditing || disabled ? "opacity-60" : ""}
                                                        />
                                                    </FormControl>
                                                    <FormLabel className="font-normal">
                                                        Mark as stable version
                                                    </FormLabel>
                                                </div>
                                                <FormDescription className="ml-6 mt-1">
                                                    {isEditing
                                                        ? "Stability status cannot be modified here. Use the 'Set Stable' action from the versions list."
                                                        : "Stable versions are recommended for production use."
                                                    }
                                                </FormDescription>
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </Form>
                    </Card>

                    {/* Action Buttons Card */}
                    <Card className="p-6 mt-6">
                        <h3 className="text-lg font-semibold">Actions</h3>
                        {isEditing && (
                            <div className="text-sm text-amber-700 bg-amber-50 p-3 rounded-md border border-amber-200">
                                <p className="font-medium">Editing Mode</p>
                                <p>Only commit hash and release notes can be modified.</p>
                            </div>
                        )}
                        <div className="space-y-3">
                            <Button
                                type="submit"
                                onClick={form.handleSubmit(handleSubmit)}
                                disabled={disabled || isLoading || isSuccess || isVerifyingBranch}
                                className="w-full"
                            >
                                {isLoading && (
                                    <IconLoader className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                {isEditing ? "Update Version" : "Create Version"}
                            </Button>

                            <Button
                                variant="outline"
                                type="button"
                                onClick={() => form.reset()}
                                className="w-full"
                                disabled={disabled || isLoading}
                            >
                                Reset Form
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}