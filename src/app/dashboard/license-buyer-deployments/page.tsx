"use client";

import { useState, useMemo } from "react";
import {
  useGetLicenseBuyerDeploymentsQuery,
  DeploymentStatus,
  DeploymentEnvironment,
  Deployment,
} from "@/store/features/deployments";
import { useGetProjectsQuery } from "@/store/features/projects";
import { useGetLicensesQuery } from "@/store/features/licenses";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  IconRefresh,
  IconEye,
  IconRocket,
  IconCheck,
  IconX,
  IconExternalLink,
  IconPlus,
} from "@tabler/icons-react";
import Link from "next/link";
import DashboardLayout from "@/components/dashboard-layout";
import { BreadcrumbItem } from "@/components/breadcrumb";
import { formatDistanceToNow } from "date-fns";
import DeploymentStatusBadge from "../deployments/components/deployment-status-badge";

const breadcrumbItems: BreadcrumbItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "License Buyer Deployments", href: "/dashboard/license-buyer-deployments" },
];

export default function LicenseBuyerDeploymentsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [environmentFilter, setEnvironmentFilter] = useState<string>("all");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [selectedLicenseId, setSelectedLicenseId] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Fetch projects for filter dropdown
  const { data: projectsData, isLoading: isLoadingProjects } = useGetProjectsQuery({ limit: 50 });

  // Fetch licenses for filter dropdown
  const { data: licensesData, isLoading: isLoadingLicenses } = useGetLicensesQuery({ limit: 50 });

  // Main query for license buyer deployments
  const { data, isLoading, isFetching, refetch } = useGetLicenseBuyerDeploymentsQuery({
    project_id: selectedProjectId !== "all" ? selectedProjectId : undefined,
    license_id: selectedLicenseId !== "all" ? selectedLicenseId : undefined,
    status: statusFilter !== "all" ? (statusFilter as DeploymentStatus) : undefined,
    environment: environmentFilter !== "all" ? (environmentFilter as DeploymentEnvironment) : undefined,
    page: currentPage,
    limit: itemsPerPage,
  });

  const deployments = useMemo(() => data?.items || [], [data?.items]);
  const totalDeployments = data?.meta?.totalItems || 0;
  const totalPages = data?.meta?.totalPages || 1;

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    return {
      total: totalDeployments,
      successful: deployments.filter((d) => d.status === DeploymentStatus.SUCCESS).length,
      failed: deployments.filter((d) => d.status === DeploymentStatus.FAILED).length,
      running: deployments.filter((d) => d.status === DeploymentStatus.RUNNING).length,
    };
  }, [deployments, totalDeployments]);

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

  const getOwnerName = (deployment: Deployment) => {
    if (deployment.owner?.firstName || deployment.owner?.lastName) {
      return `${deployment.owner.firstName || ""} ${deployment.owner.lastName || ""}`.trim();
    }
    return deployment.owner?.email || "Unknown User";
  };

  const getOwnerInitials = (deployment: Deployment) => {
    if (deployment.owner?.firstName && deployment.owner?.lastName) {
      return `${deployment.owner.firstName[0]}${deployment.owner.lastName[0]}`.toUpperCase();
    }
    if (deployment.owner?.email) {
      return deployment.owner.email[0].toUpperCase();
    }
    return "?";
  };

  return (
    <DashboardLayout breadcrumbItems={breadcrumbItems}>
      <div className="flex flex-col gap-4 md:gap-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              License Buyer Deployments
            </h1>
            <p className="text-muted-foreground">
              View and manage deployments made by users who purchased your licenses
            </p>
          </div>
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <IconRefresh className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Deployments</CardTitle>
              <IconRocket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{summaryStats.total}</div>
              )}
              <p className="text-xs text-muted-foreground">
                By license buyers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Successful</CardTitle>
              <IconCheck className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold text-green-500">{summaryStats.successful}</div>
              )}
              <p className="text-xs text-muted-foreground">
                Completed successfully
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <IconX className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold text-red-500">{summaryStats.failed}</div>
              )}
              <p className="text-xs text-muted-foreground">
                Need attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Running</CardTitle>
              <IconRocket className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold text-blue-500">{summaryStats.running}</div>
              )}
              <p className="text-xs text-muted-foreground">
                In progress
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>
              Filter deployments by project, license, status, or environment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projectsData?.items.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedLicenseId} onValueChange={setSelectedLicenseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select license" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Licenses</SelectItem>
                  {licensesData?.items.map((license) => (
                    <SelectItem key={license.id} value={license.id}>
                      {license.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
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

              <Select value={environmentFilter} onValueChange={setEnvironmentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Environment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Environments</SelectItem>
                  <SelectItem value={DeploymentEnvironment.PRODUCTION}>Production</SelectItem>
                  <SelectItem value={DeploymentEnvironment.PREVIEW}>Preview</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Deployments Table */}
        <Card>
          <CardHeader>
            <CardTitle>Deployments</CardTitle>
            <CardDescription>
              Showing {deployments.length} of {totalDeployments} deployments
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Buyer</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>License</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Environment</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...Array(5)].map((_, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <div className="space-y-1">
                              <Skeleton className="h-4 w-24" />
                              <Skeleton className="h-3 w-32" />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Skeleton className="h-8 w-8 rounded-md" />
                            <Skeleton className="h-8 w-8 rounded-md" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : deployments.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <IconRocket className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>No deployments found</p>
                <p className="text-sm">License buyers haven&apos;t made any deployments yet</p>
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Buyer</TableHead>
                        <TableHead>Project</TableHead>
                        <TableHead>License</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Environment</TableHead>
                        <TableHead>Branch</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deployments.map((deployment) => (
                        <TableRow key={deployment.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs">
                                  {getOwnerInitials(deployment)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium text-sm">
                                  {getOwnerName(deployment)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {deployment.owner?.email}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{deployment.project?.name}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{deployment.license?.name || "-"}</div>
                          </TableCell>
                          <TableCell>
                            <DeploymentStatusBadge status={deployment.status} />
                          </TableCell>
                          <TableCell>
                            <span className="capitalize">{deployment.environment}</span>
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                              {deployment.branch}
                            </code>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {formatDistanceToNow(new Date(deployment.created_at), {
                                addSuffix: true,
                              })}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {deployment.deployment_url && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  asChild
                                >
                                  <a
                                    href={deployment.deployment_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <IconExternalLink className="h-4 w-4" />
                                  </a>
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                asChild
                              >
                                <Link href={`/dashboard/deployments/${deployment.id}`}>
                                  <IconEye className="h-4 w-4" />
                                </Link>
                              </Button>
                              {deployment.user_license && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  asChild
                                >
                                  <Link href={`/dashboard/license-buyer-deployments/deploy/${deployment.user_license.id}`}>
                                    <IconPlus className="h-4 w-4 mr-1" />
                                    Deploy
                                  </Link>
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1 || isFetching}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={currentPage >= totalPages || isFetching}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
