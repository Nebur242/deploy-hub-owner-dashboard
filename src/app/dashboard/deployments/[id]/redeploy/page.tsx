"use client";

import { useState, useEffect, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/dashboard-layout";
import { BreadcrumbItem } from "@/components/breadcrumb";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
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
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import {
  IconLoader,
  IconRocket,
  IconArrowLeft,
  IconRefresh,
  IconVideo,
  IconArrowUp,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  useGetDeploymentQuery,
  useRedeployDeploymentMutation,
  DeploymentEnvironment,
  DeploymentStatus,
} from "@/store/features/deployments";
import { useGetVersionsQuery } from "@/store/features/projects";
import { EnvironmentVariable } from "@/common/types";
import { VideoPlayerModal } from "@/components/video-player-modal";
import { JsonKeyValueEditor } from "@/components/json-key-value-editor";

// Version regex for formatting version numbers
const versionRegex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

// Form schema for redeploy
const redeployFormSchema = z.object({
  environment: z.nativeEnum(DeploymentEnvironment),
  branch: z.string().min(1, "Branch is required"),
});

type RedeployFormValues = z.infer<typeof redeployFormSchema>;

// Mode type for the page
type PageMode = "redeploy" | "update";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function RedeployPage({ params }: PageProps) {
  const { id: deploymentId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Determine mode from query params (default to redeploy)
  const mode: PageMode = searchParams.get("mode") === "update" ? "update" : "redeploy";

  // State for environment variable values
  const [envVarValues, setEnvVarValues] = useState<Record<string, string>>({});
  // State for project versions
  const [projectVersions, setProjectVersions] = useState<string[]>(["main"]);
  // State to toggle showing only required variables
  const [showOnlyRequired, setShowOnlyRequired] = useState(true);
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

  // Fetch deployment details
  const {
    data: deployment,
    isLoading: isLoadingDeployment,
    isError: isDeploymentError,
  } = useGetDeploymentQuery(deploymentId);

  // Fetch project versions
  const { data: versionsData, isLoading: isLoadingVersions } = useGetVersionsQuery(
    deployment?.project?.id || "",
    { skip: !deployment?.project?.id }
  );

  // Redeploy mutation
  const [redeployDeployment, { isLoading: isRedeploying }] = useRedeployDeploymentMutation();

  // Form setup
  const form = useForm<RedeployFormValues>({
    resolver: zodResolver(redeployFormSchema),
    defaultValues: {
      environment: DeploymentEnvironment.PRODUCTION,
      branch: "main",
    },
  });

  // Update form values when deployment is loaded
  useEffect(() => {
    if (deployment) {
      // Get the default branch from the configuration, falling back to deployment branch or 'main'
      const configDefaultBranch = deployment.configuration?.github_accounts?.[0]?.default_branch;
      const defaultBranch = configDefaultBranch || deployment.branch || "main";
      
      form.reset({
        environment: deployment.environment as DeploymentEnvironment,
        branch: defaultBranch,
      });

      // Initialize env var values from deployment
      if (deployment.environment_variables) {
        const initialValues: Record<string, string> = {};
        deployment.environment_variables.forEach((envVar) => {
          initialValues[envVar.key] = envVar.default_value || "";
        });
        setEnvVarValues(initialValues);
      }
    }
  }, [deployment, form]);

  // Update versions when data is loaded
  useEffect(() => {
    if (versionsData && Array.isArray(versionsData)) {
      // Get the default branch from the configuration
      const configDefaultBranch = deployment?.configuration?.github_accounts?.[0]?.default_branch || "main";
      const versions = [configDefaultBranch];
      versionsData.forEach(({ version }: { version: string }) => {
        if (version !== configDefaultBranch && !versions.includes(version)) {
          versions.push(version);
        }
      });
      setProjectVersions(versions);
    } else {
      const configDefaultBranch = deployment?.configuration?.github_accounts?.[0]?.default_branch || "main";
      setProjectVersions([configDefaultBranch]);
    }
  }, [versionsData, deployment?.configuration?.github_accounts]);

  // Handler for environment variable changes
  const handleEnvVarChange = (key: string, value: string) => {
    setEnvVarValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Video modal handlers
  const openVideoModal = (envVar: EnvironmentVariable) => {
    if (envVar.video) {
      setVideoModal({
        isOpen: true,
        videoUrl: envVar.video,
        title: `Tutorial: ${envVar.key}`,
      });
    }
  };

  const closeVideoModal = () => {
    setVideoModal({
      isOpen: false,
      videoUrl: "",
      title: "",
    });
  };

  // Get environment variables from deployment
  const envVars = deployment?.environment_variables || [];
  const filteredEnvVars = showOnlyRequired
    ? envVars.filter((envVar) => envVar.is_required)
    : envVars;
  const requiredCount = envVars.filter((envVar) => envVar.is_required).length;
  const optionalCount = envVars.length - requiredCount;

  // Form submit handler
  const onSubmit = async (data: RedeployFormValues) => {
    try {
      // Build environment variables for submission
      const formattedEnvVars: EnvironmentVariable[] = envVars.map((envVar) => ({
        key: envVar.key,
        is_secret: envVar.is_secret,
        is_required: envVar.is_required,
        description: envVar.description || "",
        default_value: envVarValues[envVar.key] || envVar.default_value || "",
        type: envVar.type || "text",
        video: envVar.video || null,
      }));

      await redeployDeployment({
        deploymentId,
        data: {
          environment: data.environment,
          branch: data.branch,
          environment_variables: formattedEnvVars,
        },
      }).unwrap();

      toast.success(mode === "update" ? "Update initiated" : "Redeploy initiated", {
        description: mode === "update" 
          ? "Your deployment is being updated to the new version."
          : "Your deployment is being redeployed with the new settings.",
      });

      router.push(`/dashboard/deployments/${deploymentId}`);
    } catch (error) {
      console.error("Failed to redeploy:", error);
      const err = error as { data?: { message?: string } };
      toast.error(mode === "update" ? "Failed to update" : "Failed to redeploy", {
        description: err.data?.message || "An unexpected error occurred. Please try again.",
      });
    }
  };

  // Page title based on mode
  const pageTitle = mode === "update" ? "Update" : "Redeploy";

  // Breadcrumb items
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Deployments", href: "/dashboard/deployments" },
    { label: deployment?.id?.substring(0, 8) || "...", href: `/dashboard/deployments/${deploymentId}` },
    { label: pageTitle },
  ];

  // Determine if we can edit environment variables (only in redeploy mode)
  const canEditEnvVars = mode === "redeploy";

  // Loading state
  if (isLoadingDeployment) {
    return (
      <DashboardLayout breadcrumbItems={breadcrumbItems} title={pageTitle}>
        <div className="flex flex-col gap-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (isDeploymentError || !deployment) {
    return (
      <DashboardLayout breadcrumbItems={breadcrumbItems} title={pageTitle}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load deployment details. The deployment may not exist or you don&apos;t have
            permission to view it.
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button variant="outline" asChild>
            <Link href="/dashboard/deployments">
              <IconArrowLeft className="mr-2 h-4 w-4" />
              Back to Deployments
            </Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  // Check if deployment can be redeployed
  const isStatusValid =
    deployment.status === DeploymentStatus.SUCCESS ||
    deployment.status === DeploymentStatus.FAILED;

  if (!isStatusValid) {
    return (
      <DashboardLayout breadcrumbItems={breadcrumbItems} title={pageTitle}>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Cannot {pageTitle}</AlertTitle>
          <AlertDescription>
            This deployment cannot be {mode === "update" ? "updated" : "redeployed"} because it is currently{" "}
            {deployment.status.toLowerCase()}. Only completed (success or failed) deployments can be
            {mode === "update" ? " updated" : " redeployed"}.
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/deployments/${deploymentId}`}>
              <IconArrowLeft className="mr-2 h-4 w-4" />
              Back to Deployment
            </Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout breadcrumbItems={breadcrumbItems} title={pageTitle}>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/dashboard/deployments/${deploymentId}`}>
              <IconArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              {mode === "update" ? (
                <IconArrowUp className="h-6 w-6" />
              ) : (
                <IconRefresh className="h-6 w-6" />
              )}
              {pageTitle}
            </h1>
            <p className="text-muted-foreground">
              {mode === "update" 
                ? `Update deployment ${deployment.id.substring(0, 8)} to a different version`
                : `Modify settings and redeploy deployment ${deployment.id.substring(0, 8)}`}
            </p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Main column */}
              <div className="md:col-span-2 space-y-6">
                {/* Deployment Settings Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>{mode === "update" ? "Version Settings" : "Deployment Settings"}</CardTitle>
                    <CardDescription>
                      {mode === "update" 
                        ? "Select the branch or version to update to"
                        : "Configure deployment options for redeploy"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Environment - only show in redeploy mode */}
                    {mode === "redeploy" && (
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
                                <SelectItem value={DeploymentEnvironment.PREVIEW}>Preview</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Current: {deployment.environment}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {/* Branch */}
                    <FormField
                      control={form.control}
                      name="branch"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Branch / Version</FormLabel>
                          <FormControl>
                            {isLoadingVersions ? (
                              <Select disabled value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Loading versions..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value={field.value || "main"}>Loading...</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select branch or version" />
                                </SelectTrigger>
                                <SelectContent>
                                  {projectVersions.map((version) => (
                                    <SelectItem key={version} value={version}>
                                      {versionRegex.test(version) ? `v${version}` : version}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </FormControl>
                          <FormDescription>
                            Current: {deployment.branch}
                            {mode === "update" && projectVersions.length === 1 && (
                              <span className="block text-amber-600 mt-1">
                                No other versions available. Create a new version to update.
                              </span>
                            )}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Environment Variables Card - only show in redeploy mode */}
                {canEditEnvVars && (
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>Environment Variables</CardTitle>
                          <CardDescription>
                            Modify environment variables for this redeploy
                            {envVars.length > 0 && (
                              <span className="block mt-1">
                                {requiredCount} required, {optionalCount} optional
                              </span>
                            )}
                          </CardDescription>
                        </div>
                      {envVars.length > 0 && optionalCount > 0 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowOnlyRequired(!showOnlyRequired)}
                          className="shrink-0"
                        >
                          {showOnlyRequired ? (
                            <>
                              <Eye className="h-4 w-4 mr-2" />
                              Show All ({envVars.length})
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-4 w-4 mr-2" />
                              Required Only ({requiredCount})
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {filteredEnvVars.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground">
                        {showOnlyRequired && optionalCount > 0
                          ? "No required environment variables."
                          : "No environment variables configured."}
                      </div>
                    ) : (
                      <div className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredEnvVars.map((envVar) => (
                          <div key={envVar.key} className="p-4 border rounded-md">
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
                                disabled={isRedeploying}
                                hasError={!!(envVar.is_required && !envVarValues[envVar.key])}
                              />
                            ) : (
                              <div className="relative">
                                <Input
                                  type={envVar.is_secret && !visibleSecrets[envVar.key] ? "password" : "text"}
                                  placeholder={
                                    envVar.is_required
                                      ? `Enter value for ${envVar.key} (required)`
                                      : `Enter value for ${envVar.key}`
                                  }
                                  value={envVarValues[envVar.key] || ""}
                                  onChange={(e) => handleEnvVarChange(envVar.key, e.target.value)}
                                  disabled={isRedeploying}
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
                                    disabled={isRedeploying}
                                  >
                                    {visibleSecrets[envVar.key] ? (
                                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                      <Eye className="h-4 w-4 text-muted-foreground" />
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
                                <Badge variant="outline" className="bg-red-500/10 text-red-500">
                                  Required
                                </Badge>
                              )}
                              {envVar.is_secret && (
                                <Badge variant="outline" className="bg-blue-500/10 text-blue-500">
                                  Secret
                                </Badge>
                              )}
                              {envVar.video && (
                                <Badge variant="outline" className="bg-purple-500/10 text-purple-500">
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
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Original Deployment Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Original Deployment</CardTitle>
                    <CardDescription>Information about the deployment being {mode === "update" ? "updated" : "redeployed"}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Project</span>
                      <span className="text-sm font-medium">{deployment.project?.name || "N/A"}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Configuration</span>
                      <span className="text-sm font-medium">
                        {deployment.configuration?.name || "N/A"}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <Badge
                        variant={deployment.status === DeploymentStatus.SUCCESS ? "default" : "destructive"}
                      >
                        {deployment.status}
                      </Badge>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Environment</span>
                      <span className="text-sm font-medium">{deployment.environment}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Branch</span>
                      <span className="text-sm font-medium">{deployment.branch}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Actions Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isRedeploying}
                    >
                      {isRedeploying ? (
                        <>
                          <IconLoader className="h-4 w-4 mr-2 animate-spin" />
                          {mode === "update" ? "Updating..." : "Redeploying..."}
                        </>
                      ) : (
                        <>
                          {mode === "update" ? (
                            <IconArrowUp className="h-4 w-4 mr-2" />
                          ) : (
                            <IconRocket className="h-4 w-4 mr-2" />
                          )}
                          {mode === "update" ? "Update" : "Redeploy"}
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => router.push(`/dashboard/deployments/${deploymentId}`)}
                      disabled={isRedeploying}
                    >
                      Cancel
                    </Button>
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
