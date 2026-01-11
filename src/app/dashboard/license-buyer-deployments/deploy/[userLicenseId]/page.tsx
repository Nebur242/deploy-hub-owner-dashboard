"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import Link from "next/link";

import DashboardLayout from "@/components/dashboard-layout";
import { BreadcrumbItem } from "@/components/breadcrumb";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  IconLoader,
  IconRocket,
  IconArrowLeft,
  IconUser,
  IconAlertCircle,
  IconVideo,
  IconEye,
  IconEyeOff,
} from "@tabler/icons-react";
import { AlertCircle } from "lucide-react";

import {
  useCreateDeploymentOnBehalfMutation,
  DeploymentEnvironment,
} from "@/store/features/deployments";
import {
  useGetProjectsQuery,
  useGetConfigurationsQuery,
  useGetVersionsQuery,
  useGetConfigurationQuery,
} from "@/store/features/projects";
import { useGetUserLicenseQuery } from "@/store/features/licenses";
import { EnvironmentVariable } from "@/common/types";
import { VideoPlayerModal } from "@/components/video-player-modal";
import { JsonKeyValueEditor } from "@/components/json-key-value-editor";

const deployOnBehalfSchema = z.object({
  title: z.string().optional(),
  project_id: z.string().min(1, "Please select a project"),
  configuration_id: z.string().min(1, "Please select a configuration"),
  environment: z.nativeEnum(DeploymentEnvironment),
  branch: z.string().min(1, "Please enter a branch"),
});

type DeployOnBehalfFormValues = z.infer<typeof deployOnBehalfSchema>;

interface PageProps {
  params: Promise<{ userLicenseId: string }>;
}

export default function DeployOnBehalfPage({ params }: PageProps) {
  const { userLicenseId } = use(params);
  const router = useRouter();
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedConfigId, setSelectedConfigId] = useState<string>("");
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [configEnvVars, setConfigEnvVars] = useState<EnvironmentVariable[]>([]);
  const [envVarValues, setEnvVarValues] = useState<Record<string, string>>({});

  // State for video modal
  const [videoModal, setVideoModal] = useState<{
    isOpen: boolean;
    videoUrl: string;
    title: string;
  }>({
    isOpen: false,
    videoUrl: "",
    title: "",
  });

  // State to track visibility of secret fields
  const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>({});

  // Toggle visibility of a secret field
  const toggleSecretVisibility = (key: string) => {
    setVisibleSecrets(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Function to open video modal
  const openVideoModal = (envVar: EnvironmentVariable) => {
    if (envVar.video) {
      setVideoModal({
        isOpen: true,
        videoUrl: envVar.video,
        title: `Tutorial: ${envVar.key}`,
      });
    }
  };

  // Function to close video modal
  const closeVideoModal = () => {
    setVideoModal({
      isOpen: false,
      videoUrl: "",
      title: "",
    });
  };

  // Fetch user license details
  const {
    data: userLicense,
    isLoading: isLoadingUserLicense,
    error: userLicenseError,
  } = useGetUserLicenseQuery(userLicenseId);

  const [createDeploymentOnBehalf, { isLoading: isCreating }] =
    useCreateDeploymentOnBehalfMutation();

  // Fetch projects
  const { data: projectsData, isLoading: isLoadingProjects } = useGetProjectsQuery({
    limit: 100,
    page: 1,
  });

  // Fetch configurations for selected project
  const { data: configurationsData, isLoading: isLoadingConfigurations } =
    useGetConfigurationsQuery(selectedProjectId, { skip: !selectedProjectId });

  // Fetch project versions
  const { data: versionsData, isLoading: isLoadingVersions } = useGetVersionsQuery(
    selectedProjectId,
    { skip: !selectedProjectId }
  );

  // Fetch configuration details for environment variables
  const {
    data: configData,
    isLoading: isLoadingConfigData,
    error: configFetchError,
  } = useGetConfigurationQuery(
    {
      projectId: selectedProjectId,
      configId: selectedConfigId,
    },
    {
      skip: !selectedProjectId || !selectedConfigId,
      refetchOnMountOrArgChange: true,
    }
  );

  // Load configuration environment variables
  useEffect(() => {
    if (!configData) return;
    const envVars = configData.deployment_option?.environment_variables || [];
    setConfigEnvVars(envVars);

    // Initialize env var values with default values from configuration
    const initialValues: Record<string, string> = {};
    envVars.forEach((envVar) => {
      initialValues[envVar.key] = envVar.default_value || "";
    });
    setEnvVarValues(initialValues);
  }, [configData]);

  const form = useForm<DeployOnBehalfFormValues>({
    resolver: zodResolver(deployOnBehalfSchema),
    defaultValues: {
      title: "",
      project_id: "",
      configuration_id: "",
      environment: DeploymentEnvironment.PRODUCTION,
      branch: "main",
    },
  });

  // Update configuration_id and reset env vars when project changes
  useEffect(() => {
    if (selectedProjectId) {
      form.setValue("configuration_id", "");
      setSelectedConfigId("");
      setConfigEnvVars([]);
      setEnvVarValues({});
    }
  }, [selectedProjectId, form]);

  const projects = projectsData?.items || [];
  const configurations = configurationsData || [];
  
  // Ensure 'main' is always included as a default branch option
  const versions = (() => {
    const mappedVersions = versionsData?.map((v: { version: string }) => v.version) || [];
    // Always include 'main' at the beginning if not already present
    if (!mappedVersions.includes("main")) {
      return ["main", ...mappedVersions];
    }
    return mappedVersions.length > 0 ? mappedVersions : ["main"];
  })();

  const handleProjectChange = (projectId: string) => {
    setSelectedProjectId(projectId);
    form.setValue("project_id", projectId);
  };

  const handleConfigChange = (configId: string) => {
    setSelectedConfigId(configId);
    form.setValue("configuration_id", configId);
  };

  const handleEnvVarChange = (key: string, value: string) => {
    setEnvVarValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const onSubmit = async (data: DeployOnBehalfFormValues) => {
    setSubmissionError(null);

    // Validate required environment variables
    const missingRequiredVars = configEnvVars
      .filter(
        (envVar) =>
          envVar.is_required &&
          (!envVarValues[envVar.key] || envVarValues[envVar.key].trim() === "")
      )
      .map((envVar) => envVar.key);

    if (missingRequiredVars.length > 0) {
      toast.error("Required environment variables missing", {
        description: `Please provide values for: ${missingRequiredVars.join(", ")}`,
        duration: 5000,
      });
      return;
    }

    // Process environment variables
    const processedEnvVars = configEnvVars.map((envVar) => ({
      ...envVar,
      default_value: envVarValues[envVar.key] || envVar.default_value || "",
    }));

    try {
      await createDeploymentOnBehalf({
        userLicenseId,
        data: {
          title: data.title || undefined,
          environment: data.environment,
          branch: data.branch,
          configuration_id: data.configuration_id,
          environment_variables: processedEnvVars,
        },
      }).unwrap();

      toast.success("Deployment created", {
        description: `Deployment created successfully on behalf of the license buyer`,
      });

      router.push("/dashboard/license-buyer-deployments");
    } catch (err) {
      const error = err as { data?: { message?: string } };
      setSubmissionError(
        error.data?.message || "Failed to create deployment. Please try again."
      );
    }
  };

  const getOwnerName = () => {
    if (userLicense?.owner?.firstName || userLicense?.owner?.lastName) {
      return `${userLicense.owner.firstName || ""} ${userLicense.owner.lastName || ""}`.trim();
    }
    return userLicense?.owner?.email || "Unknown User";
  };

  const getInitials = (name: string) => {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name[0]?.toUpperCase() || "?";
  };

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Buyer Deployments", href: "/dashboard/license-buyer-deployments" },
    { label: "Deploy on Behalf" },
  ];

  if (isLoadingUserLicense) {
    return (
      <DashboardLayout breadcrumbItems={breadcrumbItems}>
        <div className="flex flex-col gap-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (userLicenseError || !userLicense) {
    return (
      <DashboardLayout breadcrumbItems={breadcrumbItems}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load user license details. The license may not exist or you don&apos;t
            have permission to view it.
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button variant="outline" asChild>
            <Link href="/dashboard/license-buyer-deployments">
              <IconArrowLeft className="mr-2 h-4 w-4" />
              Back to Buyer Deployments
            </Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const ownerName = getOwnerName();

  return (
    <DashboardLayout breadcrumbItems={breadcrumbItems}>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/license-buyer-deployments">
              <IconArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <IconRocket className="h-6 w-6" />
              Deploy on Behalf
            </h1>
            <p className="text-muted-foreground">
              Create a deployment on behalf of a license buyer
            </p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Main column - 2/3 width */}
              <div className="md:col-span-2 space-y-6">
                {/* Project Details Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Project Details</CardTitle>
                    <CardDescription>
                      Select the project and configuration for this deployment
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Title */}
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Production Release v1.0" {...field} />
                          </FormControl>
                          <FormDescription>
                            A friendly name to identify this deployment
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Project Selection */}
                    <FormField
                      control={form.control}
                      name="project_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={handleProjectChange}
                            disabled={isLoadingProjects}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a project" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {projects.map((project) => (
                                <SelectItem key={project.id} value={project.id}>
                                  {project.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>Select the project to deploy</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Configuration Selection */}
                    <FormField
                      control={form.control}
                      name="configuration_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Configuration</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={handleConfigChange}
                            disabled={!selectedProjectId || isLoadingConfigurations}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={
                                    !selectedProjectId
                                      ? "Select a project first"
                                      : isLoadingConfigurations
                                      ? "Loading configurations..."
                                      : "Select a configuration"
                                  }
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {configurations.map((config) => (
                                <SelectItem key={config.id} value={config.id}>
                                  {config.name ||
                                    `${config.deployment_option?.provider || "Unknown"} Config`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Select the deployment configuration to use
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Environment Variables Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Environment Variables</CardTitle>
                    <CardDescription>
                      Environment variables from the selected configuration
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {isLoadingConfigData ? (
                      <div className="flex items-center justify-center py-6">
                        <IconLoader className="h-6 w-6 animate-spin text-primary mr-2" />
                        <span>Loading configuration details...</span>
                      </div>
                    ) : configFetchError ? (
                      <Alert variant="destructive">
                        <IconAlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>
                          Failed to load configuration details. Please try again.
                        </AlertDescription>
                      </Alert>
                    ) : !selectedConfigId ? (
                      <Alert>
                        <IconAlertCircle className="h-4 w-4" />
                        <AlertTitle>Required</AlertTitle>
                        <AlertDescription>
                          Please select a configuration to see the required environment
                          variables.
                        </AlertDescription>
                      </Alert>
                    ) : configEnvVars.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground">
                        No environment variables found for this configuration.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {configEnvVars.map((envVar) => (
                          <div
                            key={envVar.key}
                            className={`${envVar.is_required ? "block" : "hidden"} p-4 border rounded-md`}
                          >
                            <div className="mb-2 flex items-start justify-between">
                              <div className="flex-1">
                                <span className="font-medium">{envVar.key}</span>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {envVar.description}
                                </p>
                              </div>
                              {envVar.video && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="shrink-0 ml-2 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                                  onClick={() => openVideoModal(envVar)}
                                  title="Watch tutorial video"
                                >
                                  <IconVideo className="h-5 w-5" />
                                </Button>
                              )}
                            </div>

                            {envVar.type === "json" ? (
                              <JsonKeyValueEditor
                                defaultJson={envVar.default_value || "{}"}
                                value={envVarValues[envVar.key] || ""}
                                onChange={(value) => handleEnvVarChange(envVar.key, value)}
                                disabled={isCreating}
                                hasError={!!(envVar.is_required && !envVarValues[envVar.key])}
                              />
                            ) : (
                              <div className="relative">
                                <Input
                                  type={envVar.is_secret && !visibleSecrets[envVar.key] ? "password" : "text"}
                                  placeholder={
                                    envVar.is_required
                                      ? `Enter value for ${envVar.key} (required)`
                                      : `Enter value for ${envVar.key} (default: ${envVar.default_value || "empty"})`
                                  }
                                  value={envVarValues[envVar.key] || ""}
                                  onChange={(e) => handleEnvVarChange(envVar.key, e.target.value)}
                                  disabled={isCreating}
                                  className={`${
                                    envVar.is_required && !envVarValues[envVar.key]
                                      ? "border-red-500"
                                      : ""
                                  } ${envVar.is_secret ? "pr-10" : ""}`}
                                />
                                {envVar.is_secret && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                    onClick={() => toggleSecretVisibility(envVar.key)}
                                    disabled={isCreating}
                                  >
                                    {visibleSecrets[envVar.key] ? (
                                      <IconEyeOff className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                      <IconEye className="h-4 w-4 text-muted-foreground" />
                                    )}
                                  </Button>
                                )}
                              </div>
                            )}

                            <div className="flex items-center gap-2 mt-3">
                              {envVar.type === "json" && (
                                <Badge
                                  variant="outline"
                                  className="bg-emerald-500/10 text-emerald-500"
                                >
                                  JSON
                                </Badge>
                              )}
                              {envVar.is_required && (
                                <Badge
                                  variant="outline"
                                  className="bg-red-500/10 text-red-500"
                                >
                                  Required
                                </Badge>
                              )}
                              {envVar.is_secret && (
                                <Badge
                                  variant="outline"
                                  className="bg-blue-500/10 text-blue-500"
                                >
                                  Secret
                                </Badge>
                              )}
                              {envVar.video && (
                                <Badge
                                  variant="outline"
                                  className="bg-purple-500/10 text-purple-500"
                                >
                                  Has Tutorial
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar column - 1/3 width */}
              <div className="space-y-6">
                {/* License Buyer Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <IconUser className="h-4 w-4" />
                      License Buyer
                    </CardTitle>
                    <CardDescription>
                      This deployment will use the buyer&apos;s deployment quota
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{getInitials(ownerName)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{ownerName}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {userLicense.owner?.email}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Deployments</span>
                        <span className="text-sm font-medium">
                          {userLicense.count} / {userLicense.max_deployments}
                        </span>
                      </div>
                      {userLicense.license && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">License</span>
                          <span className="text-sm font-medium">
                            {userLicense.license.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Deployment Settings Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Deployment Settings</CardTitle>
                    <CardDescription>Configure deployment options</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Environment */}
                    <FormField
                      control={form.control}
                      name="environment"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Environment</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select environment" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value={DeploymentEnvironment.PRODUCTION}>
                                Production
                              </SelectItem>
                              <SelectItem value={DeploymentEnvironment.PREVIEW}>
                                Preview
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Choose the target environment
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Branch */}
                    <FormField
                      control={form.control}
                      name="branch"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Branch</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                            disabled={!selectedProjectId || isLoadingVersions}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={
                                    isLoadingVersions ? "Loading branches..." : "Select branch"
                                  }
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {versions.map((version: string) => (
                                <SelectItem key={version} value={version}>
                                  {version}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>Select the branch to deploy from</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Action Card */}
                <Card>
                  <CardContent className="pt-6">
                    {/* Error Alert */}
                    {submissionError && (
                      <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{submissionError}</AlertDescription>
                      </Alert>
                    )}

                    <div className="flex flex-col gap-3">
                      <Button type="submit" disabled={isCreating} className="w-full">
                        {isCreating ? (
                          <>
                            <IconLoader className="mr-2 h-4 w-4 animate-spin" />
                            Creating Deployment...
                          </>
                        ) : (
                          <>
                            <IconRocket className="mr-2 h-4 w-4" />
                            Create Deployment
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push("/dashboard/license-buyer-deployments")}
                        disabled={isCreating}
                        className="w-full"
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        </Form>
      </div>

      {/* Video Player Modal */}
      <VideoPlayerModal
        isOpen={videoModal.isOpen}
        onClose={closeVideoModal}
        videoUrl={videoModal.videoUrl}
        title={videoModal.title}
      />
    </DashboardLayout>
  );
}
