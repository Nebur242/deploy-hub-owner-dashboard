"use client";

import { useState } from "react";
import {
  useGetProjectsQuery,
  useDeleteProjectMutation,
} from "@/store/features/projects";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Visibility, TechStack } from "@/common/enums/project";
import {
  IconPlus,
  IconSearch,
  IconLoader,
  IconRefresh,
  IconEdit,
  IconTrash,
  IconGitBranch,
  IconEye,
} from "@tabler/icons-react";
import Link from "next/link";
import DashboardLayout from "@/components/dashboard-layout";
import { BreadcrumbItem } from "@/components/breadcrumb";
import { toast } from "sonner";
import { Project } from "@/common/types";

export default function ProjectsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState<string>("all");
  const [techStackFilter, setTechStackFilter] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const { data, isLoading, isFetching, error, refetch } = useGetProjectsQuery({
    search: searchTerm || undefined,
    visibility: visibilityFilter !== "all" ? visibilityFilter : undefined,
    techStack: techStackFilter !== "all" ? techStackFilter : undefined,
    page: currentPage,
    limit: itemsPerPage,
  });

  // Delete project mutation
  const [deleteProject, { isLoading: isDeleting }] = useDeleteProjectMutation();

  const projects = data?.items || [];
  const totalProjects = data?.meta?.totalItems || 0;
  const totalPages = data?.meta?.totalPages || 1;

  // For handling delete confirmation
  const handleDeleteClick = (project: Project) => {
    setProjectToDelete(project);
    setDeleteDialogOpen(true);
  };

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

  //   const handleItemsPerPageChange = (value: string) => {
  //     setItemsPerPage(Number(value));
  //     setCurrentPage(1); // Reset to first page when changing items per page
  //   };

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;

    try {
      // Call the RTK Query delete mutation
      await deleteProject(projectToDelete.id).unwrap();

      // Show success toast
      toast.success("Project deleted", {
        description: `"${projectToDelete.name}" has been deleted successfully.`,
      });

      // Reset state
      setProjectToDelete(null);
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error("Failed to delete project:", error);
      const err = error as { message?: string };
      // Show error toast
      toast.error("Delete failed", {
        description:
          err?.message ||
          "There was an error deleting the project. Please try again.",
      });
    }
  };

  // Breadcrumb items
  const breadcrumbItems: BreadcrumbItem[] = [{ label: "Projects" }];

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
        <Link href="/dashboard/projects/create">
          <IconPlus className="h-4 w-4 mr-2" /> Create Project
        </Link>
      </Button>
    </>
  );

  return (
    <DashboardLayout
      breadcrumbItems={breadcrumbItems}
      title="Projects"
      actions={actionButtons}
    >
      <div className="flex flex-col gap-6">
        <div className="flex gap-4 flex-col sm:flex-row mb-4">
          <div className="relative w-full sm:w-1/3">
            <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page on search
              }}
            />
          </div>
          <Select
            value={visibilityFilter}
            onValueChange={(value) => {
              setVisibilityFilter(value);
              setCurrentPage(1); // Reset to first page on filter change
            }}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Visibility" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Visibility</SelectItem>
              <SelectItem value={Visibility.PUBLIC}>Public</SelectItem>
              <SelectItem value={Visibility.PRIVATE}>Private</SelectItem>
              <SelectItem value={Visibility.FEATURED}>Featured</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={techStackFilter}
            onValueChange={(value) => {
              setTechStackFilter(value);
              setCurrentPage(1); // Reset to first page on filter change
            }}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Tech Stack" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tech Stacks</SelectItem>
              <SelectItem value={TechStack.REACT}>React</SelectItem>
              <SelectItem value={TechStack.NEXTJS}>Next.js</SelectItem>
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
              Error loading projects. Please try again.
            </p>
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-12">
            <p className="text-muted-foreground">No projects found.</p>
            <Link href="/dashboard/projects/create">
              <Button>
                <IconPlus className="mr-2 h-4 w-4" />
                Create your first project
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Tech Stack</TableHead>
                    <TableHead>Visibility</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <span>{project.name}</span>
                          {project.versions && project.versions.length > 0 && (
                            <Badge variant="outline" className="ml-2">
                              {project.versions.length} version{project.versions.length !== 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate">
                        {project.description}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {project.techStack.map((tech: TechStack) => (
                            <Badge key={tech} variant="outline">
                              {tech}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            project.visibility === Visibility.FEATURED
                              ? "default"
                              : "outline"
                          }
                          className={
                            project.visibility === Visibility.PRIVATE
                              ? "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20"
                              : project.visibility === Visibility.FEATURED
                                ? "bg-primary"
                                : ""
                          }
                        >
                          {project.visibility}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(project.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50"
                          >
                            <Link href={`/dashboard/projects/${project.id}`}>
                              <IconEye className="h-4 w-4 mr-1" /> View
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="text-purple-500 hover:text-purple-700 hover:bg-purple-50"
                          >
                            <Link
                              href={`/dashboard/projects/${project.id}/versions`}
                            >
                              <IconGitBranch className="h-4 w-4 mr-1" /> Versions
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Link
                              href={`/dashboard/projects/${project.id}/edit`}
                            >
                              <IconEdit className="h-4 w-4 mr-1" /> Edit
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDeleteClick(project)}
                            disabled={
                              isDeleting && projectToDelete?.id === project.id
                            }
                          >
                            {isDeleting &&
                              projectToDelete?.id === project.id ? (
                              <>
                                <IconLoader className="h-4 w-4 mr-1 animate-spin" />{" "}
                                Deleting...
                              </>
                            ) : (
                              <>
                                <IconTrash className="h-4 w-4 mr-1" /> Delete
                              </>
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-between space-x-2 py-4">
              <div className="flex-1 text-sm text-muted-foreground">
                Showing {projects.length} of {totalProjects} projects
              </div>
              <div className="space-x-2 flex items-center">
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={currentPage <= 1 || isLoading}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage >= totalPages || isLoading}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the project &quot;
              {projectToDelete?.name}&quot;. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-white"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <IconLoader className="h-4 w-4 mr-1 animate-spin" />{" "}
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}