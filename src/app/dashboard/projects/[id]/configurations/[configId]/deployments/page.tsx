"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard-layout";
import { BreadcrumbItem } from "@/components/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  IconPlus,
  IconLoader,
  IconChevronLeft,
  IconBrandGithub,
  IconCalendar,
  IconArrowRight,
  IconRefresh
} from "@tabler/icons-react";
import Link from "next/link";
import {
  useGetDeploymentsQuery,
  DeploymentEnvironment
} from "@/store/features/deployments";
import { DeploymentStatusBadge } from "../../../../../deployments/components";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function ConfigurationDeploymentsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const configId = params.configId as string;
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch deployments for this specific project and configuration
  const {
    data,
    isLoading,
    isError,
    refetch
  } = useGetDeploymentsQuery({
    project_id: projectId,
    page: currentPage,
    limit: 10,
  }, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
    pollingInterval: 45000,
  });

  const deployments = data?.items || [];
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

  // Breadcrumb items
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Projects", href: "/dashboard/projects" },
    { label: "Project Details", href: `/dashboard/projects/${projectId}` },
    {
      label: "Configurations",
      href: `/dashboard/projects/${projectId}/configurations`
    },
    {
      label: "Configuration Details",
      href: `/dashboard/projects/${projectId}/configurations/${configId}`
    },
    { label: "Deployments" },
  ];

  return (
    <DashboardLayout
      breadcrumbItems={breadcrumbItems}
      title="Configuration Deployments"
      actions={
        <>
          <Button
            variant="outline"
            asChild
          >
            <Link href={`/dashboard/projects/${projectId}/configurations/${configId}`}>
              <IconChevronLeft className="h-4 w-4 mr-2" /> Back to Configuration
            </Link>
          </Button>
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <IconRefresh
              className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            {isLoading ? "Refreshing..." : "Refresh"}
          </Button>
          <Button
            asChild
          >
            <Link href={`/dashboard/deployments/create?projectId=${projectId}&configurationId=${configId}`}>
              <IconPlus className="h-4 w-4 mr-2" /> New Deployment
            </Link>
          </Button>
        </>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <IconLoader className="h-8 w-8 animate-spin text-primary mr-2" />
          <span>Loading deployments...</span>
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-destructive">Error loading deployments.</p>
              <Button
                variant="outline"
                onClick={() => router.refresh()}
                className="mt-4"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : deployments.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Deployments Found</CardTitle>
            <CardDescription>
              This configuration doesn&apos;t have any deployments yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <p className="text-muted-foreground mb-4">
                Deploy this configuration to see the deployment history.
              </p>
              <Button asChild>
                <Link href={`/dashboard/deployments/create?projectId=${projectId}&configurationId=${configId}`}>
                  <IconPlus className="h-4 w-4 mr-2" /> Create Your First Deployment
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Deployment History</CardTitle>
            <CardDescription>
              View all deployments for this configuration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Environment</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deployments.map((deployment) => {
                  // Calculate duration if both timestamps exist
                  const duration = deployment.completed_at && deployment.created_at
                    ? new Date(deployment.completed_at).getTime() - new Date(deployment.created_at).getTime()
                    : null;

                  // Format duration in a readable way
                  const formatDuration = (ms: number | null) => {
                    if (ms === null) return "-";

                    const seconds = Math.floor(ms / 1000);
                    if (seconds < 60) return `${seconds}s`;

                    const minutes = Math.floor(seconds / 60);
                    const remainingSeconds = seconds % 60;
                    return `${minutes}m ${remainingSeconds}s`;
                  };

                  return (
                    <TableRow key={deployment.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <IconCalendar className="h-4 w-4 mr-1" />
                          {format(new Date(deployment.created_at), "MMM d, yyyy")}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(deployment.created_at), "h:mm a")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          deployment.environment === DeploymentEnvironment.PRODUCTION
                            ? "bg-green-500/10 text-green-500"
                            : "bg-blue-500/10 text-blue-500"
                        }>
                          {deployment.environment}
                        </Badge>
                      </TableCell>
                      <TableCell className="flex items-center">
                        <IconBrandGithub className="h-4 w-4 mr-1 inline-block" />
                        <span>{deployment.branch}</span>
                      </TableCell>
                      <TableCell>
                        <DeploymentStatusBadge status={deployment.status} />
                      </TableCell>
                      <TableCell>
                        {formatDuration(duration)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Link href={`/dashboard/deployments/${deployment.id}`}>
                            <IconArrowRight className="h-4 w-4 mr-1" /> View Details
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {/* Enhanced Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="flex-1 text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                  {data?.meta && (
                    <span className="ml-2">
                      (Showing {deployments.length} of {data.meta.totalItems} deployments)
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage <= 1}
                  >
                    First
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousPage}
                    disabled={currentPage <= 1}
                  >
                    Previous
                  </Button>
                  <div className="px-2">
                    <span className="text-sm">
                      {currentPage}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={currentPage >= totalPages}
                  >
                    Next
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage >= totalPages}
                  >
                    Last
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
}