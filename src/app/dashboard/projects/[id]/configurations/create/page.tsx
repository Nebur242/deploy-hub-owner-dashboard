"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  useGetProjectQuery,
  useCreateConfigurationMutation,
} from "@/store/features/projects";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import DashboardLayout from "@/components/dashboard-layout";
import { BreadcrumbItem } from "@/components/breadcrumb";
import ConfigurationForm from "../components/configuration-form";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CreateConfigurationDto } from "@/common/dtos";
import { getErrorMessage } from "@/utils/functions";

export default function CreateConfigurationPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const projectId = params?.id || "";

  // Get project details for breadcrumb
  const { data: project, isLoading: isLoadingProject } =
    useGetProjectQuery(projectId);

  // Create configuration mutation
  const [createConfiguration, { isLoading, error, isSuccess }] =
    useCreateConfigurationMutation();

  // Breadcrumb items
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Projects", href: "/dashboard/projects" },
    {
      label: project?.name || "Project",
      href: `/dashboard/projects/${projectId}/edit`,
    },
    { label: "Add Configuration" },
  ];

  // Action buttons
  const actionButtons = (
    <Button
      variant="outline"
      size="sm"
      onClick={() => router.push(`/dashboard/projects/${projectId}/edit`)}
      className="flex items-center"
    >
      <ArrowLeft className="h-4 w-4 mr-1" />
      Back to Project
    </Button>
  );

  // Redirect after successful creation
  useEffect(() => {
    if (isSuccess) {
      // Show success toast
      toast.success("Configuration created successfully");

      // Set a short timeout before redirecting to see the success state
      const timer = setTimeout(() => {
        router.push(`/dashboard/projects/${projectId}/edit`);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [isSuccess, router, projectId]);

  const handleSubmit = async (body: CreateConfigurationDto) => {
    console.log("Creating configuration with body:", body);
    createConfiguration({
      projectId,
      body,
    });
  };

  // If project is still loading, show loading state
  if (isLoadingProject) {
    return (
      <DashboardLayout
        breadcrumbItems={breadcrumbItems}
        title="Create Configuration"
        actions={actionButtons}
      >
        <div className="flex justify-center items-center p-12">
          <div className="text-center">
            <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-lg font-medium">
              Loading project information...
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // If project not found, show error
  if (!project) {
    return (
      <DashboardLayout
        breadcrumbItems={[{ label: "Projects", href: "/dashboard/projects" }]}
        title="Error"
        actions={actionButtons}
      >
        <Alert variant="destructive" className="max-w-xl mx-auto my-8">
          <AlertTitle>Project not found</AlertTitle>
          <AlertDescription>
            The project you&apos;re trying to add configuration for could not be
            found.
          </AlertDescription>
          <div className="mt-4">
            <Button onClick={() => router.push("/dashboard/projects")}>
              Return to Projects
            </Button>
          </div>
        </Alert>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      breadcrumbItems={breadcrumbItems}
      title={`Add Configuration for ${project.name}`}
      actions={actionButtons}
    >
      <ConfigurationForm
        projectId={projectId}
        isEditing={false}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        isSuccess={isSuccess}
        error={
          error
            ? {
              message:
                getErrorMessage(error) ||
                "Failed to create configuration.",
            }
            : null
        }
      />
    </DashboardLayout>
  );
}
