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
import { useGetProjectsQuery, useGetConfigurationsQuery, useGetVersionsQuery } from "@/store/features/projects";
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
  // State for project versions
  const [projectVersions, setProjectVersions] = useState<string[]>(['main']);
  // State for submission error feedback
  const [submissionError, setSubmissionError] = useState<string | null>(null);

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

  // Fetch project versions using the current project ID
  const {
    data: versionsData,
    isLoading: isLoadingVersions
  } = useGetVersionsQuery(currentProjectId || '', {
    skip: !currentProjectId
  });

  // Update versions when data is loaded
  useEffect(() => {
    if (versionsData && Array.isArray(versionsData)) {
      // Ensure 'main' is always included and at the beginning
      const versions = ['main'];
      versionsData.forEach(({ version }) => {
        if (version !== 'main' && !versions.includes(version)) {
          versions.push(version);
        }
      });
      setProjectVersions(versions);
    } else {
      // Default to just 'main' if no versions were returned
      setProjectVersions(['main']);
    }
  }, [versionsData]);

  // Handler for project change
  const handleProjectChange = (selectedProjectId: string) => {
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
  const projects = projectsData?.items || [];

  // Process configurations data for form use
  const configurations = configurationsData?.map(config => ({
    ...config,
    id: config.id,
    name: `Configuration ${config.id.substring(0, 4)} (${config.deploymentOption.provider})`
  })) || [];

  // Handle form submission
  const handleSubmit = async (data: DeploymentFormValues) => {
    // Reset any previous submission errors
    setSubmissionError(null);

    // Process environment variables from the form
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

    // Create the deployment using the mutation
    const result = createDeployment({
      projectId: data.projectId,
      configurationId: data.configurationId,
      environment: data.environment,
      branch: data.branch,
      environmentVariables: formattedEnvVars,
    });

    try {
      // Wait for the result and unwrap it (throws if there's an error)
      await result.unwrap();
      // Navigate to deployments list on success
      router.push("/dashboard/deployments");
    } catch (err) {
      // Handle error with proper user feedback
      const error = err as { data?: { message?: string } };
      setSubmissionError(
        error.data?.message ||
        "Failed to create deployment. Please check your inputs and try again."
      );
    }
  };

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
          projectVersions={projectVersions}
          isLoading={isLoading}
          isSuccess={isSuccess}
          error={error as { message: string } | null}
          onProjectChange={handleProjectChange}
          onEnvVarChange={handleEnvVarChange}
          envVarValues={envVarValues}
          isLoadingVersions={isLoadingVersions}
        />
      )}
      {submissionError && (
        <Alert className="mt-4" variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{submissionError}</AlertDescription>
        </Alert>
      )}
    </DashboardLayout>
  );
}