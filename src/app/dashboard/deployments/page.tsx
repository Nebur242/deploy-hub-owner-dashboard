"use client";

import { useState, useEffect } from "react";
import {
  useGetDeploymentsQuery,
  useRetryDeploymentMutation,
  DeploymentStatus,
  DeploymentEnvironment,
} from "@/store/features/deployments";
import { useGetProjectsQuery } from "@/store/features/projects";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  IconPlus,
  IconSearch,
  IconLoader,
  IconRefresh,
  IconEye,
  // IconPlayCircle,
  IconPlayCard,
  IconChevronRight,
  // IconFileText,
  IconTerminal,
} from "@tabler/icons-react";
import Link from "next/link";
import DashboardLayout from "@/components/dashboard-layout";
import { BreadcrumbItem } from "@/components/breadcrumb";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import DeploymentStatusBadge from "./components/deployment-status-badge";

export default function DeploymentsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [environmentFilter, setEnvironmentFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(undefined);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [deploymentToRetry, setDeploymentToRetry] = useState<string | null>(null);
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);

  // Fetch projects for the filter dropdown
  const {
    data: projectsData,
    isLoading: isLoadingProjects
  } = useGetProjectsQuery({ limit: 50 });

  // Update projects list when data is loaded
  useEffect(() => {
    if (projectsData?.items) {
      setProjects([
        { id: "all", name: "All Projects" },
        ...projectsData.items.map(project => ({
          id: project.id,
          name: project.name
        }))
      ]);
    }
  }, [projectsData]);

  // Main deployments query
  const { data, isLoading, isFetching, error, refetch } = useGetDeploymentsQuery({
    projectId: selectedProjectId || "",
    status: statusFilter !== "all" ? statusFilter as DeploymentStatus : undefined,
    environment: environmentFilter !== "all" ? environmentFilter as DeploymentEnvironment : undefined,
    page: currentPage,
    limit: itemsPerPage,
  }, {
    pollingInterval: 45000, // Poll every minute
    refetchOnFocus: true,
    refetchOnReconnect: true,
    skipPollingIfUnfocused: true,
  });

  // Retry deployment mutation
  const [retryDeployment, { isLoading: isRetrying }] = useRetryDeploymentMutation();

  const deployments = data?.items || [];
  const totalDeployments = data?.meta?.totalItems || 0;
  const totalPages = data?.meta?.totalPages || 1;

  // Handle pagination manually since we're using API pagination
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  // Open the confirmation dialog
  const openRetryConfirmation = (deploymentId: string) => {
    setDeploymentToRetry(deploymentId);
    setConfirmDialogOpen(true);
  };

  // Handle the actual retry operation
  const handleRetryDeployment = async () => {
    if (!deploymentToRetry) return;

    try {
      // Call the RTK Query retry mutation
      await retryDeployment(deploymentToRetry).unwrap();

      // Show success toast
      toast.success("Deployment retry initiated", {
        description: "Your deployment retry has been initiated successfully.",
      });

      // Close the dialog
      setConfirmDialogOpen(false);
      setDeploymentToRetry(null);
    } catch (error) {
      console.error("Failed to retry deployment:", error);
      const err = error as { message?: string };
      // Show error toast
      toast.error("Retry failed", {
        description:
          err?.message ||
          "There was an error retrying the deployment. Please try again.",
      });
    }
  };

  // Breadcrumb items
  const breadcrumbItems: BreadcrumbItem[] = [{ label: "Deployments" }];

  // Action buttons for the header
  const actionButtons = (
    <>
      <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
        <IconRefresh
          className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`}
        />
        {isFetching ? "Refreshing..." : "Refresh"}
      </Button>
      <Button asChild>
        <Link href="/dashboard/deployments/create">
          <IconPlus className="h-4 w-4 mr-2" /> New Deployment
        </Link>
      </Button>
    </>
  );

  return (
    <DashboardLayout
      breadcrumbItems={breadcrumbItems}
      title="Deployments"
      actions={actionButtons}
    >
      <div className="flex flex-col gap-6">
        <div className="flex gap-4 flex-col sm:flex-row mb-4">
          <div className="relative w-full sm:w-1/4">
            <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search deployments..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page on search
              }}
            />
          </div>

          {/* Project Filter */}
          <Select
            value={selectedProjectId || "all"}
            onValueChange={(value) => {
              setSelectedProjectId(value === "all" ? undefined : value);
              setCurrentPage(1); // Reset to first page on filter change
            }}
            disabled={isLoadingProjects}
          >
            <SelectTrigger className="w-full sm:w-[220px]">
              {isLoadingProjects ? (
                <span className="flex items-center">
                  <IconLoader className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </span>
              ) : (
                <SelectValue placeholder="Select Project" />
              )}
            </SelectTrigger>
            <SelectContent>
              {projects.map(project => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              setCurrentPage(1); // Reset to first page on filter change
            }}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value={DeploymentStatus.PENDING}>Pending</SelectItem>
              <SelectItem value={DeploymentStatus.RUNNING}>Running</SelectItem>
              <SelectItem value={DeploymentStatus.SUCCESS}>Success</SelectItem>
              <SelectItem value={DeploymentStatus.FAILED}>Failed</SelectItem>
              <SelectItem value={DeploymentStatus.CANCELED}>Canceled</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={environmentFilter}
            onValueChange={(value) => {
              setEnvironmentFilter(value);
              setCurrentPage(1); // Reset to first page on filter change
            }}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Environment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Environments</SelectItem>
              <SelectItem value={DeploymentEnvironment.PRODUCTION}>Production</SelectItem>
              <SelectItem value={DeploymentEnvironment.PREVIEW}>Preview</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <IconLoader className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-destructive">
              Error loading deployments. Please try again.
            </p>
          </div>
        ) : deployments.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-12">
            <p className="text-muted-foreground">No deployments found.</p>
            <Link href="/dashboard/deployments/create">
              <Button>
                <IconPlus className="mr-2 h-4 w-4" />
                Create your first deployment
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Environment</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deployments.map((deployment) => (
                    <TableRow key={deployment.id}>
                      <TableCell className="font-medium">
                        {deployment.project?.name || 'Unknown Project'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {deployment.environment}
                        </Badge>
                      </TableCell>
                      <TableCell>{deployment.branch}</TableCell>
                      <TableCell>
                        <DeploymentStatusBadge status={deployment.status} />
                      </TableCell>
                      <TableCell>
                        {formatDistanceToNow(new Date(deployment.createdAt), {
                          addSuffix: true,
                        })}
                      </TableCell>
                      <TableCell>
                        {deployment.completedAt
                          ? formatDistanceToNow(new Date(deployment.completedAt), {
                            addSuffix: true,
                          })
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50"
                          >
                            <Link href={`/dashboard/deployments/${deployment.id}`}>
                              <IconEye className="h-4 w-4 mr-1" /> View
                            </Link>
                          </Button>
                          {deployment.status === DeploymentStatus.FAILED && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-amber-500 hover:text-amber-700 hover:bg-amber-50"
                              onClick={() => openRetryConfirmation(deployment.id)}
                              disabled={deploymentToRetry === deployment.id && isRetrying}
                            >
                              {deploymentToRetry === deployment.id && isRetrying ? (
                                <>
                                  <IconLoader className="h-4 w-4 mr-1 animate-spin" />{" "}
                                  Retrying...
                                </>
                              ) : (
                                <>
                                  <IconPlayCard className="h-4 w-4 mr-1" />  Retry
                                </>
                              )}
                            </Button>
                          )}
                          {deployment.deploymentUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-green-500 hover:text-green-700 hover:bg-green-50"
                              asChild
                            >
                              <a
                                href={deployment.deploymentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <IconChevronRight className="h-4 w-4 mr-1" /> Visit
                              </a>
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                            asChild
                          >
                            <Link href={`/dashboard/deployments/${deployment.id}/logs`}>
                              <IconTerminal className="h-4 w-4 mr-1" /> Logs
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-between space-x-2 py-4 items-center">
              <div className="flex-1 text-sm text-muted-foreground">
                Showing {deployments.length} of {totalDeployments} deployments
                {selectedProjectId && selectedProjectId !== "all" && projects.find(p => p.id === selectedProjectId) && (
                  <span className="ml-2 font-medium">
                    for {projects.find(p => p.id === selectedProjectId)?.name}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage <= 1 || isLoading}
                >
                  First
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={currentPage <= 1 || isLoading}
                >
                  Previous
                </Button>
                <div className="px-2">
                  <span className="text-sm">
                    {currentPage} of {totalPages}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage >= totalPages || isLoading}
                >
                  Next
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage >= totalPages || isLoading}
                >
                  Last
                </Button>
              </div>
            </div>
          </>
        )}
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
            <AlertDialogCancel onClick={() => setDeploymentToRetry(null)}>Cancel</AlertDialogCancel>
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