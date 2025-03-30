"use client";

import { useCreateCategoryMutation } from "@/store/features/categories";
import CategoryForm, { CategoryFormData } from "../components/category-form";
import { CreateCategoryDto } from "@/common/types/category";
import DashboardLayout from "@/components/dashboard-layout";
import { BreadcrumbItem } from "@/components/breadcrumb";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function CreateCategoryPage() {
  const router = useRouter();

  // RTK Query hook for creating a category
  const [createCategory, { isLoading, error, isSuccess }] = useCreateCategoryMutation();

  // Breadcrumb items
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Categories", href: "/dashboard/categories" },
    { label: "Create New" }
  ];

  const handleSubmit = async (data: CategoryFormData) => {
    const categoryData: CreateCategoryDto = {
      name: data.name,
      slug: data.slug,
      description: data.description,
      icon: data.icon,
      status: data.status,
      parentId: data.parentCategory,
      sortOrder: data.sortOrder,
    };

    // Call the RTK Query mutation
    await createCategory(categoryData);
  };

  // Action buttons
  const actionButtons = (
    <Button variant="outline" onClick={() => router.push("/dashboard/categories")}>
      Cancel
    </Button>
  );

  return (
    <DashboardLayout
      breadcrumbItems={breadcrumbItems}
      title="Create Category"
      actions={actionButtons}
    >
      <CategoryForm
        isEditing={false}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        isSuccess={isSuccess}
        error={error}
      />
    </DashboardLayout>
  );
}