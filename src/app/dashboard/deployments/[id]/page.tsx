"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import DashboardLayout from "@/components/dashboard-layout";
import { BreadcrumbItem } from "@/components/breadcrumb";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  IconLoader,
  IconCheck,
  IconX,
  IconClock,
  IconServer,
  IconBrandGithub,
  IconChevronLeft,
  IconPlayCard,
  IconChevronRight,
  // IconFileText,
  IconAlertCircle,
  IconInfoCircle,
  IconRefresh,
  IconCode,
  IconTerminal,
  IconListDetails,
  IconFlask,
} from "@tabler/icons-react";
import { formatDistanceToNow, format } from "date-fns";
import { toast } from "sonner";
import { useGetDeploymentQuery, useGetDeploymentLogsQuery, useRetryDeploymentMutation, DeploymentStatus } from "@/store/features/deployments";
import Link from "next/link";
import DeploymentStatusBadge from "@/app/dashboard/deployments/components/deployment-status-badge";

export default function DeploymentDetailPage() {
  const params = useParams();
  // const router = useRouter();
  const deploymentId = params.id as string;
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch deployment
  const {
    data: deployment,
    isLoading,
    isError,
    refetch
  } = useGetDeploymentQuery(deploymentId, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
    pollingInterval: 45000,
  });

  // Fetch logs only when the logs tab is active, to avoid unnecessary requests
  const {
    data: logsData,
    isLoading: isLoadingLogs,
    isError: isLogsError
  } = useGetDeploymentLogsQuery(deploymentId, {
    skip: activeTab !== "logs"
  });

  // Retry deployment mutation
  const [retryDeployment, { isLoading: isRetrying }] = useRetryDeploymentMutation();

  // Dialog state for confirmation
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  // Handler for retry deployment
  const handleRetryDeployment = async () => {
    try {
      await retryDeployment(deploymentId).unwrap();

      toast.success("Deployment retry initiated", {
        description: "Your deployment is being retried.",
      });

      // Close the dialog
      setConfirmDialogOpen(false);

      // Refresh data
      refetch();
    } catch (error) {
      console.error("Failed to retry deployment:", error);
      const err = error as { message?: string };

      toast.error("Failed to retry deployment", {
        description: err?.message || "An unexpected error occurred. Please try again.",
      });
    }
  };

  // Breadcrumb items
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Deployments", href: "/dashboard/deployments" },
    { label: deployment?.id.substring(0, 8) || "Loading..." },
  ];

  // Action buttons for the header
  const actionButtons = deployment ? (
    <>
      <Button
        variant="outline"
        onClick={() => refetch()}
        disabled={isLoading}
      >
        <IconRefresh
          className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
        />
        Refresh
      </Button>

      <Button
        variant="outline"
        asChild
      >
        <Link href={`/dashboard/deployments/${deploymentId}/logs`}>
          <IconTerminal className="h-4 w-4 mr-2" /> View Full Logs
        </Link>
      </Button>

      {deployment.status === DeploymentStatus.FAILED && (
        <Button
          onClick={() => setConfirmDialogOpen(true)}
          disabled={isRetrying}
          className="bg-amber-500 hover:bg-amber-600 text-white"
        >
          {isRetrying ? (
            <>
              <IconLoader className="h-4 w-4 mr-2 animate-spin" /> Retrying...
            </>
          ) : (
            <>
              <IconPlayCard className="h-4 w-4 mr-2" /> Retry Deployment
            </>
          )}
        </Button>
      )}

      {deployment.deployment_url && (
        <Button asChild>
          <a
            href={deployment.deployment_url}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            <IconChevronRight className="h-4 w-4 mr-2" /> Visit Site
          </a>
        </Button>
      )}
    </>
  ) : null;

  // If loading
  if (isLoading) {
    return (
      <DashboardLayout
        breadcrumbItems={breadcrumbItems}
        title="Deployment Details"
      >
        <div className="flex items-center justify-center py-12">
          <IconLoader className="h-8 w-8 animate-spin text-primary mr-2" />
          <span>Loading deployment details...</span>
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
        title="Deployment Details"
      >
        <Alert variant="destructive">
          <IconAlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load deployment details. The deployment may not exist or there was an error.
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button asChild variant="outline">
            <Link href="/dashboard/deployments">
              <IconChevronLeft className="h-4 w-4 mr-2" /> Back to Deployments
            </Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      breadcrumbItems={breadcrumbItems}
      title={`Deployment: ${deployment.id.substring(0, 8)}`}
      actions={actionButtons}
    >
      <div className="space-y-6">
        {/* Test Mode Alert */}
        {deployment.is_test && (
          <Alert className="border-orange-300 bg-orange-50/50">
            <IconInfoCircle className="h-4 w-4 text-orange-600" />
            <AlertTitle className="text-orange-900">Test Deployment</AlertTitle>
            <AlertDescription className="text-orange-800">
              This is a <strong>test deployment</strong> used to verify your configuration. Test deployments don&apos;t count against your deployment limits and are useful for testing before making your project public.
            </AlertDescription>
          </Alert>
        )}

        {/* Status Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-xl">Deployment Status</CardTitle>
              <CardDescription>
                Created {formatDistanceToNow(new Date(deployment.created_at), { addSuffix: true })}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {deployment.is_test && (
                <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-300">
                  <IconFlask className="h-3 w-3 mr-1" /> Test Mode
                </Badge>
              )}
              <DeploymentStatusBadge status={deployment.status} />
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="grid gap-6 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Project</div>
                <div className="font-medium mt-1">
                  {deployment.project?.name || 'Unknown Project'}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Environment</div>
                <div className="font-medium mt-1">
                  <Badge variant="outline">{deployment.environment}</Badge>
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Branch</div>
                <div className="font-medium mt-1">{deployment.branch}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Completed</div>
                <div className="font-medium mt-1">
                  {deployment.completed_at
                    ? formatDistanceToNow(new Date(deployment.completed_at), {
                      addSuffix: true,
                    })
                    : "-"}
                </div>
              </div>
            </div>

            {deployment.error_message && (
              <Alert variant="destructive" className="mt-4">
                <IconAlertCircle className="h-4 w-4" />
                <AlertTitle>Deployment Error</AlertTitle>
                <AlertDescription>
                  {deployment.error_message}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          {deployment.deployment_url && (
            <CardFooter className="flex justify-between">
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">Deployment URL:</span>{" "}
                <a
                  href={deployment.deployment_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  {deployment.deployment_url}
                </a>
              </div>
            </CardFooter>
          )}
        </Card>

        {/* Tabs for Details, Logs, etc. */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">
              <IconListDetails className="h-4 w-4 mr-1" /> Overview
            </TabsTrigger>
            <TabsTrigger value="configuration">
              <IconCode className="h-4 w-4 mr-1" /> Configuration
            </TabsTrigger>
            <TabsTrigger value="logs">
              <IconTerminal className="h-4 w-4 mr-1" /> Logs
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Deployment Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex items-center justify-center mr-4 h-8 w-8 rounded-full bg-blue-100">
                      <IconClock className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Created</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(deployment.created_at), "PPpp")}
                      </p>
                    </div>
                  </div>

                  {deployment.status === DeploymentStatus.RUNNING && (
                    <div className="flex items-start">
                      <div className="flex items-center justify-center mr-4 h-8 w-8 rounded-full bg-blue-100">
                        <IconLoader className="h-4 w-4 text-blue-500 animate-spin" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Deployment in Progress</p>
                        <p className="text-sm text-muted-foreground">
                          The deployment is currently running...
                        </p>
                      </div>
                    </div>
                  )}

                  {deployment.status === DeploymentStatus.SUCCESS && (
                    <div className="flex items-start">
                      <div className="flex items-center justify-center mr-4 h-8 w-8 rounded-full bg-green-100">
                        <IconCheck className="h-4 w-4 text-green-500" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Deployment Successful</p>
                        <p className="text-sm text-muted-foreground">
                          {deployment.completed_at
                            ? format(new Date(deployment.completed_at), "PPpp")
                            : "Unknown time"}
                        </p>
                      </div>
                    </div>
                  )}

                  {deployment.status === DeploymentStatus.FAILED && (
                    <div className="flex items-start">
                      <div className="flex items-center justify-center mr-4 h-8 w-8 rounded-full bg-red-100">
                        <IconX className="h-4 w-4 text-red-500" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Deployment Failed</p>
                        <p className="text-sm text-muted-foreground">
                          {deployment.completed_at
                            ? format(new Date(deployment.completed_at), "PPpp")
                            : "Unknown time"}
                        </p>
                        {deployment.error_message && (
                          <p className="text-sm text-red-500 mt-1">
                            {deployment.error_message}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Environment Variables (hidden for security) */}
            <Card>
              <CardHeader>
                <CardTitle>Environment Variables</CardTitle>
                <CardDescription>
                  Environment variables used in this deployment
                </CardDescription>
              </CardHeader>
              <CardContent>
                {deployment.environment_variables &&
                  deployment.environment_variables.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {deployment.environment_variables.map((envVar, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <span className="font-mono text-sm">{envVar.key}</span>
                        <Badge variant="outline">
                          ••••••••
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-muted-foreground text-sm">
                    No environment variables configured for this deployment.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Configuration Tab */}
          <TabsContent value="configuration" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Deployment Configuration</CardTitle>
                <CardDescription>
                  Technical details about this deployment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Provider Information */}
                  <div>
                    <h3 className="text-lg font-medium flex items-center">
                      <IconServer className="h-5 w-5 mr-2" /> Provider Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                      <div className="p-3 border rounded">
                        <span className="text-sm font-medium text-muted-foreground">Provider</span>
                        <p className="font-medium">
                          {deployment.configuration?.deployment_option?.provider ?? "Unknown"}
                        </p>
                      </div>
                      {deployment.workflow_run_id && (
                        <div className="p-3 border rounded">
                          <span className="text-sm font-medium text-muted-foreground">Workflow ID</span>
                          <p className="font-medium">{deployment.workflow_run_id}</p>
                        </div>
                      )}
                      {deployment.retry_count > 0 && (
                        <div className="p-3 border rounded">
                          <span className="text-sm font-medium text-muted-foreground">Retry Count</span>
                          <p className="font-medium">{deployment.retry_count}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* GitHub Account Info (if available) */}
                  {deployment.github_account && (
                    <div className="mt-6">
                      <h3 className="text-lg font-medium flex items-center">
                        <IconBrandGithub className="h-5 w-5 mr-2" /> GitHub Details
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                        <div className="p-3 border rounded">
                          <span className="text-sm font-medium text-muted-foreground">Repository</span>
                          <p className="font-medium">{deployment.github_account.repository}</p>
                        </div>
                        <div className="p-3 border rounded">
                          <span className="text-sm font-medium text-muted-foreground">Username</span>
                          <p className="font-medium">{deployment.github_account.username}</p>
                        </div>
                        <div className="p-3 border rounded">
                          <span className="text-sm font-medium text-muted-foreground">Workflow File</span>
                          <p className="font-medium">{deployment.github_account.workflow_file}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Deployment Logs</CardTitle>
                <CardDescription>
                  View the complete logs from this deployment
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingLogs ? (
                  <div className="flex items-center justify-center py-12">
                    <IconLoader className="h-6 w-6 animate-spin text-primary mr-2" />
                    <span>Loading logs...</span>
                  </div>
                ) : isLogsError ? (
                  <Alert variant="destructive">
                    <IconAlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                      Failed to load deployment logs. Please try again.
                    </AlertDescription>
                  </Alert>
                ) : !logsData?.logs ? (
                  <div className="flex items-center justify-center py-12">
                    <IconInfoCircle className="h-5 w-5 mr-2 text-muted-foreground" />
                    <span className="text-muted-foreground">No logs available for this deployment.</span>
                  </div>
                ) : (
                  <div className="relative">
                    <pre className="p-4 bg-black text-white font-mono text-sm overflow-auto rounded-md max-h-96">
                      {logsData.logs}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Retry Confirmation Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retry Deployment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to retry this deployment? This will create a new deployment attempt with the same settings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRetryDeployment}
              disabled={isRetrying}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              {isRetrying ? (
                <>
                  <IconLoader className="h-4 w-4 mr-2 animate-spin" /> Retrying...
                </>
              ) : (
                "Retry Deployment"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}