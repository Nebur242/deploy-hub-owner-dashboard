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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { IconLoader } from "@tabler/icons-react";
import { SuccessAlert, ErrorAlert } from "@/components/ui/alerts";
import { ProjectVersion } from "@/common/types";

// Form schema validation
const formSchema = z.object({
    version: z.string()
        .min(1, "Version is required")
        .regex(
            /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/,
            "Version must follow semantic versioning format (X.Y.Z)"
        ),
    releaseNotes: z.string().optional(),
    commitHash: z.string().optional(),
    isStable: z.boolean().default(false),
});

export type VersionFormValues = z.infer<typeof formSchema>;

interface VersionFormProps {
    isEditing: boolean;
    initialData: ProjectVersion | null;
    onSubmit: (values: VersionFormValues) => Promise<void>;
    isLoading: boolean;
    isSuccess: boolean;
    error: { message: string } | null;
}

export default function VersionForm({
    isEditing,
    initialData,
    onSubmit,
    isLoading,
    isSuccess,
    error,
}: VersionFormProps) {
    const [submitAttempted, setSubmitAttempted] = useState(false);

    // Initialize form with default values
    const form = useForm<VersionFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: initialData || {
            version: "",
            releaseNotes: "",
            commitHash: "",
            isStable: false,
        },
    });

    // Populate form when editing and initial data is available
    useEffect(() => {
        if (isEditing && initialData) {
            form.reset({
                version: initialData.version,
                releaseNotes: initialData.releaseNotes || "",
                commitHash: initialData.commitHash || "",
                isStable: initialData.isStable,
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
                                                disabled={isEditing || isLoading || isSuccess}
                                                className={isEditing ? "bg-gray-100" : ""}
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
                                name="commitHash"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Commit Hash</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="e.g. 8f4b8a1c"
                                                {...field}
                                                disabled={isLoading || isSuccess}
                                                className={isEditing ? "border-blue-300 focus-visible:ring-blue-400" : ""}
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
                                name="releaseNotes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Release Notes</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Describe the changes in this version..."
                                                className={`min-h-[120px] ${isEditing ? "border-blue-300 focus-visible:ring-blue-400" : ""}`}
                                                {...field}
                                                disabled={isLoading || isSuccess}
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
                            <form className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="isStable"
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
                                                            disabled={isEditing || isLoading || isSuccess}
                                                            className={isEditing ? "opacity-60" : ""}
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
                            </form>
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
                                disabled={isLoading || isSuccess}
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
                                disabled={isLoading}
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