"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useFindOneCategoryQuery, useUpdateCategoryMutation } from "@/store/features/categories";
import CategoryForm, { CategoryUpdateFormData, CategoryFormData } from "../../components/category-form";
import { UpdateCategoryDto } from "@/common/types/category";
import { ArrowLeft, Loader2 } from "lucide-react";
import DashboardLayout from "@/components/dashboard-layout";
import { BreadcrumbItem } from "@/components/breadcrumb";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function EditCategoryPage() {
    const params = useParams();
    const router = useRouter();
    const categoryId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';

    const [initialValues, setInitialValues] = useState<CategoryUpdateFormData | undefined>(undefined);

    // RTK Query hook for fetching the category
    const {
        data: category,
        isLoading: isFetchingCategory,
        error: fetchError,
        refetch: refetchCategory
    } = useFindOneCategoryQuery(categoryId, {
        skip: !categoryId
    });

    // RTK Query hook for updating the category
    const [updateCategory, {
        isLoading: isUpdating,
        error: updateError,
        isSuccess,
        reset: resetUpdateState
    }] = useUpdateCategoryMutation();

    // Breadcrumb items
    const breadcrumbItems: BreadcrumbItem[] = [
        { label: "Categories", href: "/dashboard/categories" },
        { label: category ? `Edit ${category.name}` : "Edit Category" }
    ];

    // Action buttons
    const actionButtons = (
        <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/dashboard/categories")}
            className="flex items-center"
        >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Categories
        </Button>
    );

    // Set the initial values when the category data is loaded
    useEffect(() => {
        if (category) {
            setInitialValues({
                id: category.id,
                name: category.name,
                slug: category.slug,
                description: category.description,
                icon: category.icon,
                status: category.status,
                parentCategory: category.parentId || "none",
                sortOrder: category.sortOrder
            });
        }
    }, [category]);

    useEffect(() => {
        return () => {
            // Clean up when component unmounts
            resetUpdateState();
        };
    }, [resetUpdateState]);

    // Handle form submission
    const handleSubmit = async (data: CategoryFormData) => {
        try {
            const categoryData: UpdateCategoryDto = {
                id: categoryId,
                name: data.name,
                description: data.description,
                icon: data.icon,
                status: data.status,
                ...((!!data.parentCategory && data.parentCategory !== 'none') ? { parentId: data.parentCategory } : { parentId: null }),
                sortOrder: data.sortOrder,
                isActive: data.status === "active",
            };

            // Call the RTK Query mutation
            await updateCategory(categoryData).unwrap();

            // Display success message
            toast.success("Category updated", {
                description: `"${data.name}" has been updated successfully.`,
                duration: 5000,
            });

            // Redirect after successful update
            setTimeout(() => {
                router.push("/dashboard/categories");
            }, 2000);
        } catch (error) {
            // Error handling is managed by the RTK Query hook and displayed in the form
            console.error("Failed to update category:", error);
        }
    };

    // Function to retry loading if there was an error
    const handleRetryFetch = () => {
        refetchCategory();
    };

    // Show loading state while fetching the category
    if (isFetchingCategory) {
        return (
            <DashboardLayout
                breadcrumbItems={breadcrumbItems}
                title="Edit Category"
                actions={actionButtons}
            >
                <div className="flex justify-center items-center py-12">
                    <div className="text-center">
                        <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-primary" />
                        <p className="text-lg font-medium">Loading category data...</p>
                        <p className="text-sm text-muted-foreground mt-2">Please wait while we retrieve the category information.</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    // Show error state if category fetching failed
    if (fetchError) {
        return (
            <DashboardLayout
                breadcrumbItems={breadcrumbItems}
                title="Edit Category"
                actions={actionButtons}
            >
                <Alert variant="destructive" className="mb-6">
                    <AlertTitle className="text-lg font-semibold">Failed to load category</AlertTitle>
                    <AlertDescription className="mt-2">
                        <p>We couldn&apos;t load the category information. This might be due to a network issue or the category may no longer exist.</p>
                        <div className="mt-4">
                            <Button onClick={handleRetryFetch} className="mr-2">
                                Try Again
                            </Button>
                            <Button variant="outline" onClick={() => router.push("/dashboard/categories")}>
                                Return to Categories
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
            title={`Edit: ${category?.name}`}
            actions={actionButtons}
        >
            <CategoryForm
                isEditing={true}
                initialData={initialValues}
                onSubmit={handleSubmit}
                isLoading={isUpdating}
                isSuccess={isSuccess}
                error={updateError}
                excludeCategoryId={categoryId}
            />
        </DashboardLayout>
    );
}