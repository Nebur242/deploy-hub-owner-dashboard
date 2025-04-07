"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  useDeleteConfigurationMutation,
  useGetProjectQuery,
  useUpdateProjectMutation,
} from "@/store/features/projects";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowLeft, Loader2 } from "lucide-react";
import DashboardLayout from "@/components/dashboard-layout";
import { BreadcrumbItem } from "@/components/breadcrumb";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import ProjectForm, { ProjectFormData } from "../../components/project-form";
import Link from "next/link";
import { IconEdit, IconPlus, IconTrash } from "@tabler/icons-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function EditProjectPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const projectId = params?.id || "";

  const [initialValues, setInitialValues] = useState<
    ProjectFormData | undefined
  >(undefined);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [configToDelete, setConfigToDelete] = useState<{ id: string, name: string } | null>(null);


  // RTK Query hooks
  const {
    data: project,
    isLoading: isFetchingProject,
    error: fetchError,
    refetch,
  } = useGetProjectQuery(projectId);

  const [
    updateProject,
    {
      isLoading: isUpdating,
      error: updateError,
      isSuccess,
      reset: resetUpdateState,
    },
  ] = useUpdateProjectMutation();

  const [deleteConfiguration, { isLoading: isDeletingConfig }] = useDeleteConfigurationMutation();

  // Handle configuration deletion
  const handleDeleteConfig = async () => {
    if (!configToDelete) return;

    try {
      await deleteConfiguration({
        projectId,
        configId: configToDelete.id
      }).unwrap();

      toast.success("Configuration deleted", {
        description: `${configToDelete.name || "Configuration"} has been removed`,
      });

      setDeleteModalOpen(false);
      setConfigToDelete(null);

      // Refetch project to update the UI
      refetch();
    } catch (error) {
      console.error("Failed to delete configuration:", error);
      toast.error("Failed to delete", {
        description: "An error occurred while deleting the configuration.",
      });
    }
  };

  const confirmDeleteConfig = (configId: string, configName: string = "Configuration") => {
    setConfigToDelete({ id: configId, name: configName });
    setDeleteModalOpen(true);
  };

  // Breadcrumb items
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Projects", href: "/dashboard/projects" },
    { label: project ? `Edit ${project.name}` : "Edit Project" },
  ];

  // Action buttons
  const actionButtons = (
    <Button
      variant="outline"
      size="sm"
      onClick={() => router.push("/dashboard/projects")}
      className="flex items-center"
    >
      <ArrowLeft className="h-4 w-4 mr-1" />
      Back to Projects
    </Button>
  );

  // Set the initial values when the project data is loaded
  useEffect(() => {
    if (project) {
      setInitialValues({
        name: project.name,
        slug: project.slug,
        description: project.description,
        repository: project.repository || "",
        techStack: project.techStack,
        visibility: project.visibility,
        categories: project.categories || [],
      });
    }
  }, [project]);

  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      resetUpdateState();
    };
  }, [resetUpdateState]);

  // Redirect after successful update
  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        router.push("/dashboard/projects");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, router]);

  // Handle form submission
  const handleSubmit = async (data: ProjectFormData) => {
    try {
      await updateProject({
        id: projectId,
        body: data,
      }).unwrap();
    } catch (error) {
      console.error("Failed to update project:", error);
    }
  };

  // Function to retry loading if there was an error
  const handleRetryFetch = () => {
    refetch();
  };

  // Show loading state while fetching the project
  if (isFetchingProject) {
    return (
      <DashboardLayout
        breadcrumbItems={breadcrumbItems}
        title="Edit Project"
        actions={actionButtons}
      >
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-lg font-medium">Loading project data...</p>
            <p className="text-sm text-muted-foreground mt-2">
              Please wait while we retrieve the project information.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Show error state if project fetching failed
  if (fetchError) {
    return (
      <DashboardLayout
        breadcrumbItems={breadcrumbItems}
        title="Edit Project"
        actions={actionButtons}
      >
        <Alert variant="destructive" className="mb-6">
          <AlertTitle className="text-lg font-semibold">
            Failed to load project
          </AlertTitle>
          <AlertDescription className="mt-2">
            <p>
              We couldn&apos;t load the project information. This might be due
              to a network issue or the project may no longer exist.
            </p>
            <div className="mt-4">
              <Button onClick={handleRetryFetch} className="mr-2">
                Try Again
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard/projects")}
              >
                Return to Projects
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  // If initialValues is not set yet, return null
  if (!initialValues) {
    return null;
  }

  // Add configurations section if project is loaded
  const hasConfigurations =
    project?.configurations && project.configurations.length > 0;

  return (
    <DashboardLayout
      breadcrumbItems={breadcrumbItems}
      title={`Edit: ${project?.name}`}
      actions={actionButtons}
    >
      <div className="space-y-8">
        {/* Project Form */}
        <ProjectForm
          isEditing={true}
          initialData={initialValues}
          onSubmit={handleSubmit}
          isLoading={isUpdating}
          isSuccess={isSuccess}
          error={(updateError as { message: string }) || null}
        />

        {/* Configurations Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Deployment Configurations</h2>
            <Button asChild>
              <Link
                href={`/dashboard/projects/${projectId}/configurations/create`}
              >
                <IconPlus className="h-4 w-4 mr-2" /> Add Configuration
              </Link>
            </Button>
          </div>

          {hasConfigurations ? (
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {project.configurations?.map((config) => (
                <Card key={config.id} className="overflow-hidden py-0">
                  <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-4 border-b">
                    <h3 className="font-semibold">Configuration</h3>
                  </div>
                  <CardContent className="px-6 pb-6">
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">
                          Deployment Provider
                        </h4>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <Badge variant="outline">
                            {config.deploymentOption.provider}
                          </Badge>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">
                          Environment Variables
                        </h4>
                        <p className="text-sm mt-1">
                          {config.deploymentOption.environmentVariables.length} variables defined
                        </p>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">
                          Github Accounts
                        </h4>
                        <p className="text-sm mt-1">
                          {config.githubAccounts.length} accounts defined
                        </p>
                      </div>

                      <div className="pt-4 flex justify-between">
                        <Button variant="outline" size="sm" asChild>
                          <Link
                            href={`/dashboard/projects/${projectId}/configurations/${config.id}/edit`}
                          >
                            <IconEdit className="h-4 w-4" />
                            Edit Configuration
                          </Link>
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => confirmDeleteConfig(config.id, `Configuration #${config.id.substring(0, 4)}`)}
                        >
                          {isDeletingConfig ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <IconTrash className="h-4 w-4" />
                              Delete
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 flex flex-col items-center justify-center text-center">
                <div className="bg-primary/10 p-4 rounded-full mb-4">
                  <IconPlus className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-medium mb-2">
                  No Configurations Yet
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                  Add deployment configurations to define how your project
                  should be built and deployed.
                </p>
                <Button asChild>
                  <Link
                    href={`/dashboard/projects/${projectId}/configurations/create`}
                  >
                    <IconPlus className="h-4 w-4 mr-2" /> Add Your First
                    Configuration
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <DialogTitle>Delete Configuration</DialogTitle>
            </div>
            <DialogDescription className="pt-2">
              Are you sure you want to delete this configuration? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)} disabled={isDeletingConfig}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfig}
              disabled={isDeletingConfig}
            >
              {isDeletingConfig ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}