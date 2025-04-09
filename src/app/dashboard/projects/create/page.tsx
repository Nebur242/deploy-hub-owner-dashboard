"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCreateProjectMutation } from "@/store/features/projects";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import DashboardLayout from "@/components/dashboard-layout";
import { BreadcrumbItem } from "@/components/breadcrumb";
import ProjectForm from "../components/project-form";
import { toast } from "sonner";
import { CreateProjectDto } from "@/common/dtos";
import { getErrorMessage } from "@/utils/functions";

export default function CreateProjectPage() {
  const router = useRouter();
  const [createProject, { isLoading, error, isSuccess }] =
    useCreateProjectMutation();

  // Breadcrumb items
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Projects", href: "/dashboard/projects" },
    { label: "Create New" },
  ];

  // Action buttons
  const actionButtons = (
    <Button
      variant="outline"
      size="sm"
      onClick={() => router.push("/dashboard/projects")}
      className="flex items-center"
    >
      <ArrowLeft className="h-4 w-4 mr-1" />
      Back to Projects
    </Button>
  );

  // Redirect after successful creation
  useEffect(() => {
    if (isSuccess) {
      // Show success toast
      toast.success("Project created successfully");

      // Set a short timeout before redirecting to see the success state
      const timer = setTimeout(() => {
        router.push("/dashboard/projects");
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [isSuccess, router]);

  const handleSubmit = async (data: CreateProjectDto) => {
    try {
      await createProject(data).unwrap();
    } catch (error) {
      console.error("Failed to create project:", error);
    }
  };

  return (
    <DashboardLayout
      breadcrumbItems={breadcrumbItems}
      title="Create Project"
      actions={actionButtons}
    >
      <ProjectForm
        isEditing={false}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        isSuccess={isSuccess}
        error={getErrorMessage(error) ? { message: getErrorMessage(error) || 'An error occured...' } : null}
      />
    </DashboardLayout>
  );
}
