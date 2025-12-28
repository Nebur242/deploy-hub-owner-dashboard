"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Form } from "@/components/ui/form";
import { EnvironmentVariable } from "@/common/types";
import { useGetConfigurationQuery } from "@/store/features/projects";
import { SuccessAlert, ErrorAlert } from "@/components/ui/alerts";
import { DeploymentEnvironment } from "@/store/features/deployments";

// Import form schemas and types
import { deploymentSchema } from "./deployment-schemas";
import { DeploymentFormProps, DeploymentFormValues } from "./types";

// Import form section components
import {
  ProjectDetailsCard,
  DeploymentSettingsCard,
  EnvVariablesCard,
  ActionCard
} from "./form-sections";

export type { DeploymentFormValues };

export default function DeploymentForm({
  isEditing,
  onSubmit: handleFormSubmit,
  initialData,
  initialProjectId,
  initialConfigurationId,
  projects,
  configurations,
  projectVersions = ['main'],
  isLoading,
  isSuccess,
  error,
  onProjectChange,
  onEnvVarChange,
  isLoadingVersions,
}: DeploymentFormProps) {
  const router = useRouter();
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [configEnvVars, setConfigEnvVars] = useState<EnvironmentVariable[]>([]);
  const [envVarValues, setEnvVarValues] = useState<Record<string, string>>({});
  const [configError, setConfigError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Initialize form
  const form = useForm<DeploymentFormValues>({
    resolver: zodResolver(deploymentSchema),
    defaultValues: initialData || {
      environment: DeploymentEnvironment.PREVIEW,
      branch: "main",
      environment_variables: [],
      project_id: initialProjectId || "",
      configuration_id: initialConfigurationId || "",
    },
  });

  // Monitor the success state
  useEffect(() => {
    if (isSuccess) {
      setSuccess(true);
      toast.success(isEditing ? "Deployment updated" : "Deployment created", {
        description: isEditing
          ? "Your deployment has been updated successfully."
          : "Your deployment has been successfully created and is now being processed.",
        duration: 5000,
      });

      // Redirect after successful submission
      const timer = setTimeout(() => {
        router.push("/dashboard/deployments");
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isSuccess, isEditing, router]);

  // Display error toast when error changes
  useEffect(() => {
    if (error) {
      // Extract error message
      const errorMessage = error.message || "An error occurred";

      // Show toast error
      toast.error(isEditing ? "Failed to update deployment" : "Failed to create deployment", {
        description: errorMessage,
        duration: 5000,
      });
    }
  }, [error, isEditing]);

  // Handle form submission
  const onSubmit = async (data: DeploymentFormValues) => {
    try {
      // Validate required environment variables
      const missingRequiredVars = configEnvVars
        .filter(envVar => envVar.is_required && (!envVarValues[envVar.key] || envVarValues[envVar.key].trim() === ''))
        .map(envVar => envVar.key);

      if (missingRequiredVars.length > 0) {
        toast.error("Required environment variables missing", {
          description: `Please provide values for: ${missingRequiredVars.join(', ')}`,
          duration: 5000,
        });
        return;
      }

      // Process the form data
      const processedData = {
        ...data,
        environment_variables: configEnvVars.map(envVar => ({
          ...envVar,
          default_value: envVarValues[envVar.key] || envVar.default_value || ''
        }))
      };

      await handleFormSubmit(processedData);
    } catch (err) {
      console.error("Form submission error:", err);
    }
  };

  // Handle discard changes
  const handleDiscard = () => {
    form.reset();
    setSuccess(false);
  };

  // Get current project and configuration IDs
  const currentProjectId = form.watch("project_id");
  const currentConfigId = form.watch("configuration_id");

  // Fetch configuration data when projectId and configurationId are available
  const {
    data: configData,
    isLoading: isLoadingConfigData,
    error: configFetchError
  } = useGetConfigurationQuery(
    {
      projectId: currentProjectId!,
      configId: currentConfigId!
    },
    {
      skip: !currentProjectId || !currentConfigId,
      refetchOnMountOrArgChange: true
    }
  );

  // Update loading state
  useEffect(() => {
    setIsLoadingConfig(isLoadingConfigData);
  }, [isLoadingConfigData]);

  // Update error state
  useEffect(() => {
    if (configFetchError) {
      const err = configFetchError as { data?: { message?: string } };
      setConfigError(
        err?.data?.message ||
        "Failed to load configuration details. Please try again."
      );
    } else {
      setConfigError(null);
    }
  }, [configFetchError]);

  // Load configuration details when configuration data is fetched
  useEffect(() => {
    if (!configData) return;
    console.log("Configuration data:", configData);
    setConfigEnvVars(configData.deployment_option.environment_variables);

    // Initialize env var values with default values from configuration
    const initialValues: Record<string, string> = {};
    configData.deployment_option.environment_variables.forEach(envVar => {
      // Set the defaultValue from the environment variable
      initialValues[envVar.key] = envVar.default_value || "";
    });

    setEnvVarValues(initialValues);
    form.setValue('environment_variables', configData.deployment_option.environment_variables);
  }, [configData, form]);

  // Only reset environment variables when project ID actually changes (not on first render)
  useEffect(() => {
    if (currentProjectId !== initialProjectId) {
      // Reset environment variables when project changes
      setConfigEnvVars([]);
      setEnvVarValues({});
    }
  }, [currentProjectId, initialProjectId]);

  // Reset environment variables when configuration ID is cleared (but not on first render)
  useEffect(() => {
    if (!currentConfigId && currentConfigId !== initialConfigurationId) {
      setConfigEnvVars([]);
      setEnvVarValues({});
    }
  }, [currentConfigId, initialConfigurationId]);

  // Handle environment variable change
  const handleEnvVarChange = (key: string, value: string) => {
    const updatedValues = { ...envVarValues, [key]: value };
    setEnvVarValues(updatedValues);

    // Call the external handler if provided
    if (onEnvVarChange) {
      onEnvVarChange(key, value);
    }

    // Find the environment variable
    const envVarIndex = configEnvVars.findIndex(env => env.key === key);
    if (envVarIndex !== -1) {
      const updatedEnvVars = [...configEnvVars];

      // Update both the value and the defaultValue for the environment variable
      updatedEnvVars[envVarIndex] = {
        ...updatedEnvVars[envVarIndex],
        default_value: value // Always keep the user's latest value
      };

      // Update the configEnvVars state
      setConfigEnvVars(updatedEnvVars);

      // Update the form values with the new values
      form.setValue("environment_variables", updatedEnvVars);
    }
  };

  // Handle project change
  const handleProjectChange = (projectId: string) => {
    console.log("Project changed:", projectId);
    if (onProjectChange) {
      onProjectChange(projectId);
    }

    // Reset configuration and environment variables
    form.setValue("configuration_id", "");
    setConfigEnvVars([]);
    setEnvVarValues({});

    // Don't set loading state for the entire form when changing projects
    // Let the individual components handle their loading states
  };

  // Handle configuration change
  const handleConfigChange = () => {
    // Reset environment variables when configuration changes
    setConfigEnvVars([]);
    setEnvVarValues({});
  };

  return (
    <>
      {success && <SuccessAlert isEditing={isEditing} className="mb-6" />}

      {error && (
        <ErrorAlert
          message={error?.message || (isEditing ? "Failed to update deployment" : "Failed to create deployment")}
          className="mb-6"
        />
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Main column - 2/3 width */}
            <div className="md:col-span-2 space-y-6">
              <ProjectDetailsCard
                form={form}
                isLoading={isLoading}
                success={success}
                projects={projects}
                configurations={configurations}
                initialProjectId={initialProjectId}
                initialConfigurationId={initialConfigurationId}
                onConfigChange={handleConfigChange}
                onProjectChange={handleProjectChange}
              />

              <EnvVariablesCard
                form={form}
                isLoading={isLoading}
                success={success}
                configEnvVars={configEnvVars}
                envVarValues={envVarValues}
                onEnvVarChange={handleEnvVarChange}
                isLoadingConfig={isLoadingConfig}
                configError={configError}
              />
            </div>

            {/* Sidebar column - 1/3 width */}
            <div className="space-y-6">
              <DeploymentSettingsCard
                form={form}
                isLoading={isLoading}
                success={success}
                projectVersions={projectVersions}
                isLoadingVersions={isLoadingVersions}
              />
              <ActionCard
                handleDiscard={handleDiscard}
                isLoading={isLoading}
                success={success}
                isEditing={isEditing}
              />
            </div>
          </div>
        </form>
      </Form>
    </>
  );
}