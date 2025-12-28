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
import { SuccessAlert, ErrorAlert } from "@/components/ui/alerts";
import { FeaturedImageCard } from "./featured-image-card";

// Export types from schema for external use
export type CategoryFormData = z.infer<typeof categorySchema>;
export type CategoryUpdateFormData = z.infer<typeof categoryUpdateSchema>;

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
            sort_order: 1,
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
            {success && <SuccessAlert isEditing={isEditing} className="mb-6" />}

            {error && (
                <ErrorAlert
                    message={error?.message || (isEditing ? "Failed to update category" : "Failed to create category")}
                    className="mb-6"
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