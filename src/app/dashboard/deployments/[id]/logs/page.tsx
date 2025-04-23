"use client";

import { useParams } from "next/navigation";
import DashboardLayout from "@/components/dashboard-layout";
import { BreadcrumbItem } from "@/components/breadcrumb";
import { Button } from "@/components/ui/button";
import { IconChevronLeft, IconLoader } from "@tabler/icons-react";
import Link from "next/link";
import { useGetDeploymentQuery } from "@/store/features/deployments";
import { DeploymentLogs } from "../../components";

export default function DeploymentLogsPage() {
  const params = useParams();
  const deploymentId = params.id as string;

  // Fetch deployment
  const { data: deployment, isLoading } = useGetDeploymentQuery(deploymentId);

  // Breadcrumb items
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Deployments", href: "/dashboard/deployments" },
    {
      label: deployment?.id.substring(0, 8) || "Deployment",
      href: `/dashboard/deployments/${deploymentId}`
    },
    { label: "Logs" },
  ];

  // If loading
  if (isLoading) {
    return (
      <DashboardLayout
        breadcrumbItems={breadcrumbItems}
        title="Deployment Logs"
      >
        <div className="flex items-center justify-center py-12">
          <IconLoader className="h-8 w-8 animate-spin text-primary mr-2" />
          <span>Loading deployment details...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      breadcrumbItems={breadcrumbItems}
      title={`Logs: ${deployment?.id.substring(0, 8) || "Deployment"}`}
      actions={
        <Button asChild variant="outline">
          <Link href={`/dashboard/deployments/${deploymentId}`}>
            <IconChevronLeft className="h-4 w-4 mr-2" /> Back to Deployment
          </Link>
        </Button>
      }
    >
      <div className="space-y-6">
        <DeploymentLogs deploymentId={deploymentId} autoRefresh={true} />
      </div>
    </DashboardLayout>
  );
}