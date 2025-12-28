"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import DashboardLayout from "@/components/dashboard-layout";
import { BreadcrumbItem } from "@/components/breadcrumb";
import DeploymentForm from "../../components/deployment-form";
import { IconLoader, IconAlertCircle } from "@tabler/icons-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useGetDeploymentQuery } from "@/store/features/deployments";
import { useGetProjectsQuery, useGetConfigurationsQuery } from "@/store/features/projects";

export default function EditDeploymentPage() {
  const params = useParams();
  const deploymentId = params.id as string;
  const [currentProjectId, setCurrentProjectId] = useState<string | undefined>(undefined);

  // Fetch the deployment
  const {
    data: deployment,
    isLoading: isLoadingDeployment,
    isError
  } = useGetDeploymentQuery(deploymentId, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
    pollingInterval: 45000,
  });

  // Set initial project ID once deployment data is loaded
  useEffect(() => {
    if (deployment) {
      setCurrentProjectId(deployment.project_id);
    }
  }, [deployment]);

  // Fetch projects
  const {
    data: projectsData,
    isLoading: isLoadingProjects
  } = useGetProjectsQuery({
    limit: 100,
    page: 1
  });

  // Fetch configurations if projectId is provided
  const {
    data: configurationsData,
    isLoading: isLoadingConfigurations,
    refetch: refetchConfigurations
  } = useGetConfigurationsQuery(currentProjectId || '', {
    skip: !currentProjectId
  });

  // Handler for project change
  const handleProjectChange = (selectedProjectId: string) => {
    console.log("Project changed:", selectedProjectId);
    setCurrentProjectId(selectedProjectId);
    refetchConfigurations();
  };

  // Breadcrumb items
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Deployments", href: "/dashboard/deployments" },
    {
      label: deployment?.id.substring(0, 8) || "Deployment",
      href: `/dashboard/deployments/${deploymentId}`
    },
    { label: "Edit" },
  ];

  // Process projects data for form use
  const projects = projectsData?.items || [];

  // Process configurations data for form use
  const configurations = configurationsData?.map(config => ({
    ...config,
    name: `Configuration ${config.id.substring(0, 4)} (${config.deployment_option.provider})`
  })) || [];

  // Determine if we're still loading data
  const isLoading = isLoadingDeployment || isLoadingProjects || (currentProjectId && isLoadingConfigurations);

  // If loading
  if (isLoading && !deployment) {
    return (
      <DashboardLayout
        breadcrumbItems={breadcrumbItems}
        title="Edit Deployment"
      >
        <div className="flex items-center justify-center py-12">
          <IconLoader className="h-8 w-8 animate-spin text-primary mr-2" />
          <span>Loading deployment...</span>
        </div>
      </DashboardLayout>
    );
  }

  // If error
  if (isError || !deployment) {
    return (
      <DashboardLayout
        breadcrumbItems={[
          { label: "Deployments", href: "/dashboard/deployments" },
          { label: "Error" },
        ]}
        title="Edit Deployment"
      >
        <Alert variant="destructive">
          <IconAlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load deployment. The deployment may not exist or there was an error.
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button asChild variant="outline">
            <Link href="/dashboard/deployments">
              Back to Deployments
            </Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      breadcrumbItems={breadcrumbItems}
      title={`Edit Deployment: ${deployment.id.substring(0, 8)}`}
    >
      <Alert className="mb-6">
        <IconAlertCircle className="h-4 w-4" />
        <AlertTitle>Limited Editing</AlertTitle>
        <AlertDescription>
          You can only modify certain properties of an existing deployment. To create a new deployment with different settings, please use the create deployment page.
        </AlertDescription>
      </Alert>

      <DeploymentForm
        initialProjectId={deployment.project_id}
        initialConfigurationId={deployment.configuration_id}
        projects={projects}
        configurations={configurations}
        isEditing={true}
        onSubmit={async (data) => console.log('Form submitted:', data)}
        isLoading={isLoadingConfigurations}
        isSuccess={false}
        error={null}
        onProjectChange={handleProjectChange}
      />
    </DashboardLayout>
  );
}