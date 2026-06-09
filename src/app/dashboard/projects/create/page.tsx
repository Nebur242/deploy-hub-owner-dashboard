"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCreateProjectMutation, useGetProjectsQuery } from "@/store/features/projects";
import { useGetSubscriptionQuery } from "@/store/features/subscription";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import DashboardLayout from "@/components/dashboard-layout";
import { BreadcrumbItem } from "@/components/breadcrumb";
import ProjectForm from "../components/project-form";
import { toast } from "sonner";
import { CreateProjectDto } from "@/common/dtos";
import { getErrorMessage } from "@/utils/functions";
import { IconInfoCircle } from "@tabler/icons-react";

export default function CreateProjectPage() {
  const router = useRouter();
  const [createProject, { isLoading, error, isSuccess }] =
    useCreateProjectMutation();
  const { data: projectsData, isLoading: isLoadingProjects } = useGetProjectsQuery({
    limit: 1,
    page: 1,
  });
  const { data: subscription, isLoading: isLoadingSubscription } = useGetSubscriptionQuery();

  const totalProjects = projectsData?.meta?.totalItems || 0;
  const projectLimit = subscription?.max_projects ?? -1;
  const isProjectLimitReached = projectLimit !== -1 && totalProjects >= projectLimit;

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

  if (isLoadingProjects || isLoadingSubscription) {
    return (
      <DashboardLayout
        breadcrumbItems={breadcrumbItems}
        title="Create Project"
        actions={actionButtons}
      >
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (isProjectLimitReached) {
    return (
      <DashboardLayout
        breadcrumbItems={breadcrumbItems}
        title="Create Project"
        actions={actionButtons}
      >
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
          <div className="flex">
            <IconInfoCircle className="h-5 w-5 text-yellow-500 mr-3" />
            <div>
              <h3 className="font-medium text-yellow-800">Project limit reached</h3>
              <div className="text-yellow-700 mt-1">
                <p>Your current plan allows {projectLimit} total project{projectLimit === 1 ? "" : "s"}.</p>
                <p className="mt-2">Upgrade your plan to create more projects.</p>
              </div>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => router.push("/dashboard/billing")}>
                View Billing
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

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
        error={error ? { message: getErrorMessage(error) || 'An error occured...' } : null}
      />
    </DashboardLayout>
  );
}
