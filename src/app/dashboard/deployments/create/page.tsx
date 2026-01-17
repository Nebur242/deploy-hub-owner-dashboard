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
  // State to track the current configuration ID for getting default branch
  const [currentConfigId, setCurrentConfigId] = useState<string | undefined>(initialConfigurationId);
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
    // Get the default branch from the selected configuration
    const selectedConfig = configurationsData?.find(c => c.id === currentConfigId);
    const defaultBranch = selectedConfig?.github_accounts?.[0]?.default_branch || 'main';
    
    if (versionsData && Array.isArray(versionsData)) {
      // Use the branch field from versions (validated against GitHub)
      // instead of the version number
      const branches = [defaultBranch];
      versionsData.forEach(({ branch }) => {
        // Only add if branch exists and is not already in the list
        if (branch && branch !== defaultBranch && !branches.includes(branch)) {
          branches.push(branch);
        }
      });
      setProjectVersions(branches);
    } else {
      // Default to just the default branch if no versions were returned
      setProjectVersions([defaultBranch]);
    }
  }, [versionsData, configurationsData, currentConfigId]);

  // Handler for project change
  const handleProjectChange = (selectedProjectId: string) => {
    // Update the state with the new project ID
    setCurrentProjectId(selectedProjectId);
    // Reset configuration when project changes
    setCurrentConfigId(undefined);
  };

  // Handler for configuration change
  const handleConfigChange = (selectedConfigId: string) => {
    setCurrentConfigId(selectedConfigId);
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

  // In owner dashboard, the user is always the project owner
  const isProjectOwner = true;

  // Process configurations data for form use
  const configurations = configurationsData?.map(config => ({
    ...config,
    id: config.id,
    name: config.name || `Configuration ${config.id.substring(0, 4)} (${config.deployment_option.provider})`
  })) || [];

  // Handle form submission
  const handleSubmit = async (data: DeploymentFormValues) => {
    // Reset any previous submission errors
    setSubmissionError(null);

    // Process environment variables from the form
    const formattedEnvVars = data.environment_variables.map(envVar => {
      return {
        key: envVar.key,
        is_secret: envVar.is_secret || false,
        is_required: envVar.is_required || false,
        description: envVar.description || "",
        default_value: envVar.default_value || "",
        video: envVar.video || null,
        type: envVar.type || "text", // Add the required type property
      };
    });

    // Create the deployment using the mutation
    const result = createDeployment({
      project_id: data.project_id,
      configuration_id: data.configuration_id,
      environment: data.environment,
      branch: data.branch,
      environment_variables: formattedEnvVars,
      is_test: data.is_test || false, // Include test mode flag
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
          onConfigChange={handleConfigChange}
          onEnvVarChange={handleEnvVarChange}
          envVarValues={envVarValues}
          isProjectOwner={isProjectOwner}
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