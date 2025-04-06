"use client";

import { useState, useEffect } from "react";
import { Form } from "@/components/ui/form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// Import our new component files
import { categorySchema, categoryUpdateSchema } from "./category-schemas";
import { CategoryFormProps } from "./types";
import { BasicInformationCard } from "./basic-information-card";
import { IconSelectionCard } from "./icon-selection-card";
import { OrganizationStatusCard } from "./organization-status-card";
import { ActionCard } from "./action-card";
import { SuccessAlert } from "./success-alert";
import { ErrorAlert } from "./error-alert";
import { FeaturedImageCard } from "./featured-image-card";

// Export types from schema for external use
export type CategoryFormData = z.infer<typeof categorySchema>;
export type CategoryUpdateFormData = z.infer<typeof categoryUpdateSchema>;

/**
 * Renders a form for creating or editing a category.
 *
 * This component manages category details using react-hook-form and zod for validation. It supports both creation and editing modes,
 * automatically generating a slug based on the category name when applicable. The component provides feedback via toast notifications
 * and conditionally renders success and error alerts. On successful submission, it redirects the user to the categories dashboard after a short delay.
 *
 * @param isEditing - Indicates if the form is used for editing an existing category.
 * @param initialData - Optional initial values to pre-populate the form.
 * @param onSubmit - Callback to handle form submission with the current form data.
 * @param isLoading - Flag indicating whether a submission is in progress.
 * @param isSuccess - Flag indicating whether the submission was successful.
 * @param error - Contains error details if the submission fails.
 * @param excludeCategoryId - Identifier for a category to exclude from selection options.
 *
 * @returns A React component that renders the category form.
 */
export default function CategoryForm({
    isEditing,
    initialData,
    onSubmit,
    isLoading,
    isSuccess,
    error,
    excludeCategoryId
}: CategoryFormProps) {
    const router = useRouter();
    const [success, setSuccess] = useState(false);

    // Initialize the form
    const form = useForm<CategoryFormData | CategoryUpdateFormData>({
        resolver: zodResolver(isEditing ? categoryUpdateSchema : categorySchema),
        defaultValues: initialData || {
            name: "",
            slug: "",
            description: "",
            icon: "code",
            status: "active",
            parentCategory: "root",
            sortOrder: 1,
            image: null,
        }
    });

    // Get current form values to pass to child components
    const formName = form.watch("name");
    const formSlug = form.watch("slug");

    // Auto-generate slug from name
    const updateSlug = (value: string) => {
        if (!isEditing || form.getValues("slug") === "") {
            const slug = value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
            form.setValue("slug", slug, { shouldValidate: true });
        }
    };

    // Handle name change and update slug
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        form.setValue("name", e.target.value);
        updateSlug(e.target.value);
    };

    // Monitor the success state
    useEffect(() => {
        if (isSuccess) {
            setSuccess(true);
            toast.success(isEditing ? "Category updated" : "Category created", {
                description: isEditing
                    ? "Your category has been updated successfully."
                    : "Your category has been created successfully.",
                duration: 5000,
            });

            // Redirect after a short delay to show success message
            const timer = setTimeout(() => {
                router.push("/dashboard/categories");
            }, 2000);

            return () => clearTimeout(timer);
        }
    }, [isSuccess, router, isEditing]);

    // Display error toast when error changes
    useEffect(() => {
        if (error) {
            // Extract error message
            const errorMessage = error.message || "An error occurred";

            // Show toast error
            toast.error(isEditing ? "Failed to update category" : "Failed to create category", {
                description: errorMessage,
                duration: 5000,
            });
        }
    }, [error, isEditing]);

    const handleFormSubmit = async (data: CategoryFormData | CategoryUpdateFormData) => {
        try {
            await onSubmit(data);
        } catch (err) {
            console.error("Form submission error:", err);
        }
    };

    const handleDiscard = () => {
        form.reset();
        setSuccess(false);
    };

    return (
        <>
            {success && <SuccessAlert isEditing={isEditing} />}
            
            {error && (
                <ErrorAlert 
                    message={error?.message || (isEditing ? "Failed to update category" : "Failed to create category")} 
                />
            )}

            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleFormSubmit)}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Main column - 2/3 width */}
                        <div className="md:col-span-2 space-y-6">
                            <BasicInformationCard
                                form={form}
                                handleNameChange={handleNameChange}
                                isLoading={isLoading}
                                success={success}
                                isEditing={isEditing}
                                initialData={initialData}
                            />

                            <FeaturedImageCard
                                form={form}
                                isLoading={isLoading}
                                success={success}
                            />

                            <IconSelectionCard
                                form={form}
                                isLoading={isLoading}
                                success={success}
                            />
                        </div>

                        {/* Sidebar column - 1/3 width */}
                        <div className="space-y-6">
                            <OrganizationStatusCard
                                form={form}
                                isLoading={isLoading}
                                success={success}
                                formName={formName}
                                formSlug={formSlug}
                                excludeCategoryId={excludeCategoryId}
                            />

                            <ActionCard
                                handleDiscard={handleDiscard}
                                isLoading={isLoading}
                                success={success}
                                isEditing={isEditing}
                            />
                        </div>
                    </div>
                </form>
            </Form>
        </>
    );
}