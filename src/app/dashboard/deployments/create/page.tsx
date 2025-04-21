"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { DeploymentFormValues } from "../components/deployment-form";
import DashboardLayout from "@/components/dashboard-layout";
import { BreadcrumbItem } from "@/components/breadcrumb";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { IconLoader } from "@tabler/icons-react";
import { AlertCircle } from "lucide-react";
import {
  useCreateDeploymentMutation
} from "@/store/features/deployments";
import { useGetProjectsQuery, useGetConfigurationsQuery } from "@/store/features/projects";
import DeploymentForm from "../components/deployment-form";
// import { DeploymentUpdateFormValues } from "../components";

export default function CreateDeploymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialProjectId = searchParams.get('projectId') || undefined;
  const initialConfigurationId = searchParams.get('configurationId') || undefined;

  // Use state to track the current project ID
  const [currentProjectId, setCurrentProjectId] = useState<string | undefined>(initialProjectId);
  // State for tracking environment variable values entered by users
  const [envVarValues, setEnvVarValues] = useState<Record<string, string>>({});

  // Set initial project ID from URL on component mount
  useEffect(() => {
    if (initialProjectId) {
      setCurrentProjectId(initialProjectId);
    }
  }, [initialProjectId]);

  // RTK Query hooks
  const [createDeployment, { isLoading, error, isSuccess }] = useCreateDeploymentMutation();

  // Fetch projects
  const {
    data: projectsData,
    isLoading: isLoadingProjects
  } = useGetProjectsQuery({
    limit: 100,
    page: 1
  });

  // Fetch configurations using the state variable instead of URL param
  const {
    data: configurationsData,
    // isLoading: isLoadingConfigurations,
  } = useGetConfigurationsQuery(currentProjectId || '', {
    skip: !currentProjectId
  });

  // Handler for project change
  const handleProjectChange = (selectedProjectId: string) => {
    console.log("Project changed:", selectedProjectId);
    // Update the state with the new project ID
    setCurrentProjectId(selectedProjectId);
  };

  // Handler for environment variable changes
  const handleEnvVarChange = (key: string, value: string) => {
    setEnvVarValues(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Breadcrumb items
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Deployments", href: "/dashboard/deployments" },
    { label: "Create New" }
  ];

  // Action buttons
  const actionButtons = (
    <Button variant="outline" onClick={() => router.push("/dashboard/deployments")}>
      Cancel
    </Button>
  );

  // Process projects data for form use
  const projects = projectsData?.items?.map(project => ({
    id: project.id,
    name: project.name
  })) || [];

  // Process configurations data for form use
  const configurations = configurationsData?.map(config => ({
    id: config.id,
    name: `Configuration ${config.id.substring(0, 4)} (${config.deploymentOption.provider})`
  })) || [];

  // Handle form submission
  const handleSubmit = async (data: DeploymentFormValues) => {
    try {
      console.log("Form data:", data);

      // Process environment variables from the form
      // At this point, all required fields should have their defaultValue set from user input
      const formattedEnvVars = data.environmentVariables.map(envVar => {
        return {
          key: envVar.key,
          isSecret: envVar.isSecret || false,
          isRequired: envVar.isRequired || false,
          description: envVar.description || "",
          defaultValue: envVar.defaultValue || "",
          video: envVar.video || null,
        };
      });

      await createDeployment({
        projectId: data.projectId,
        configurationId: data.configurationId,
        environment: data.environment,
        branch: data.branch,
        environmentVariables: formattedEnvVars,
      }).unwrap();

      // Navigate to deployments list on success
      router.push("/dashboard/deployments");
    } catch (error) {
      console.error("Failed to create deployment:", error);
    }
  };

  // Determine if we're still loading data
  // const isDataLoading = isLoadingProjects || (currentProjectId && isLoadingConfigurations);

  // Determine if we're still loading initial data only (not configurations after project change)
  const isInitialDataLoading = isLoadingProjects;

  return (
    <DashboardLayout
      breadcrumbItems={breadcrumbItems}
      title="Create Deployment"
      actions={actionButtons}
    >
      {isInitialDataLoading ? (
        <div className="flex items-center justify-center py-12">
          <IconLoader className="h-8 w-8 animate-spin text-primary mr-2" />
          <span>Loading deployment options...</span>
        </div>
      ) : projects.length === 0 ? (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Projects Available</AlertTitle>
          <AlertDescription>
            You need to create a project with at least one configuration before you can deploy.
            <div className="mt-4">
              <Button asChild>
                <Link href="/dashboard/projects/create">Create Project</Link>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      ) : (
        <DeploymentForm
          isEditing={false}
          onSubmit={handleSubmit}
          initialProjectId={currentProjectId}
          initialConfigurationId={initialConfigurationId}
          projects={projects}
          configurations={configurations}
          isLoading={isLoading}
          isSuccess={isSuccess}
          error={error as { message: string } | null}
          onProjectChange={handleProjectChange}
          onEnvVarChange={handleEnvVarChange}
          envVarValues={envVarValues}
        />
      )}
    </DashboardLayout>
  );
}