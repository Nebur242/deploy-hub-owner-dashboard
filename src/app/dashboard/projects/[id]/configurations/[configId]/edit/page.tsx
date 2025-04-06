"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  useGetProjectQuery,
  useGetConfigurationQuery,
  useUpdateConfigurationMutation,
} from "@/store/features/projects";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/dashboard-layout";
import { BreadcrumbItem } from "@/components/breadcrumb";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import ConfigurationForm from "../../components/configuration-form";
import { CreateProjectConfigurationDto } from "@/common/types/project";

export default function EditConfigurationPage() {
  const params = useParams<{ id: string; configId: string }>();
  const router = useRouter();
  const projectId = params.id;
  const configId = params.configId;

  const [initialValues, setInitialValues] = useState<
    CreateProjectConfigurationDto | undefined
  >(undefined);

  // RTK Query hooks
  const { data: project } = useGetProjectQuery(projectId);

  const {
    data: configuration,
    isLoading: isLoadingConfig,
    error: fetchError,
    refetch,
  } = useGetConfigurationQuery({ projectId, configId });

  const [
    updateConfiguration,
    {
      isLoading: isUpdating,
      error: updateError,
      isSuccess,
      reset: resetUpdateState,
    },
  ] = useUpdateConfigurationMutation();

  // Breadcrumb items
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Projects", href: "/dashboard/projects" },
    {
      label: project?.name || "Project",
      href: `/dashboard/projects/${projectId}/edit`,
    },
    { label: "Edit Configuration" },
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

  // Set the initial values when the configuration data is loaded
  useEffect(() => {
    if (configuration) {
      setInitialValues({
        githubAccounts: configuration.githubAccounts || [],
        deploymentOptions: configuration.deploymentOptions,
        buildCommands: configuration.buildCommands,
        environmentVariables: configuration.environmentVariables,
      });
    }
  }, [configuration]);

  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      resetUpdateState();
    };
  }, [resetUpdateState]);

  // Redirect after successful update
  useEffect(() => {
    if (isSuccess) {
      // Show success toast
      toast.success("Configuration updated successfully");

      // Set a short timeout before redirecting
      const timer = setTimeout(() => {
        router.push(`/dashboard/projects/${projectId}/edit`);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [isSuccess, router, projectId]);

  // Handle form submission
  const handleSubmit = async (data: CreateProjectConfigurationDto) => {
    updateConfiguration({
      projectId,
      configId,
      body: data,
    });
  };

  // Function to retry loading if there was an error
  const handleRetryFetch = () => {
    refetch();
  };

  // Show loading state while fetching the configuration
  if (isLoadingConfig) {
    return (
      <DashboardLayout
        breadcrumbItems={breadcrumbItems}
        title="Edit Configuration"
        actions={actionButtons}
      >
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-lg font-medium">Loading configuration data...</p>
            <p className="text-sm text-muted-foreground mt-2">
              Please wait while we retrieve the configuration information.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Show error state if configuration fetching failed
  if (fetchError) {
    return (
      <DashboardLayout
        breadcrumbItems={breadcrumbItems}
        title="Edit Configuration"
        actions={actionButtons}
      >
        <Alert variant="destructive" className="mb-6">
          <AlertTitle className="text-lg font-semibold">
            Failed to load configuration
          </AlertTitle>
          <AlertDescription className="mt-2">
            <p>
              We couldn&apos;t load the configuration information. This might be
              due to a network issue or the configuration may no longer exist.
            </p>
            <div className="mt-4">
              <Button onClick={handleRetryFetch} className="mr-2">
                Try Again
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  router.push(`/dashboard/projects/${projectId}/edit`)
                }
              >
                Return to Project
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
      title={`Edit Configuration for ${project?.name || "Project"}`}
      actions={actionButtons}
    >
      <ConfigurationForm
        projectId={projectId}
        isEditing={true}
        initialData={initialValues}
        onSubmit={handleSubmit}
        isLoading={isUpdating}
        isSuccess={isSuccess}
        error={
          updateError
            ? {
                message:
                  (updateError as { data?: { message?: string } })?.data
                    ?.message || "Failed to update configuration.",
              }
            : null
        }
      />
    </DashboardLayout>
  );
}
