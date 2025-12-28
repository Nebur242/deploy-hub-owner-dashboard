"use client";

import { useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
} from "@tanstack/react-table";
import {
  ChevronDown,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { useDebounce } from "@/hooks/use-debounce";
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
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import {
  useFindAllCategoriesQuery,
  useDeleteCategoryMutation,
} from "@/store/features/categories";
// import { Category } from "@/common/types/category";
import { toast } from "sonner";
import DashboardLayout from "@/components/dashboard-layout";
import { BreadcrumbItem } from "@/components/breadcrumb";
import { Category } from "@/common/types";

export default function CategoriesPage() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  // Category-specific state
  const [categorySearchQuery, setCategorySearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const debouncedParentSearch = useDebounce(categorySearchQuery, 300);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
    null
  );

  // Data fetching with loading states
  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    isFetching: categoriesFetching,
    refetch,
  } = useFindAllCategoriesQuery({
    page: currentPage,
    limit: 10,
    search: debouncedParentSearch,
  });

  // Delete category mutation
  const [deleteCategory, { isLoading: isDeleting, error }] =
    useDeleteCategoryMutation();
  console.log("Delete error:", error);
  // Breadcrumb items
  const breadcrumbItems: BreadcrumbItem[] = [{ label: "Categories" }];

  // Action buttons for the header
  const actionButtons = (
    <>
      <Button variant="outline" onClick={() => refetch()}>
        <RefreshCw
          className={`h-4 w-4 mr-1 ${categoriesFetching ? "animate-spin" : ""}`}
        />
        Refresh
      </Button>
      <Button asChild>
        <Link href="/dashboard/categories/create" className="flex items-center">
          <Plus className="h-4 w-4 mr-1" /> Add Category
        </Link>
      </Button>
    </>
  );

  // For handling delete confirmation
  const handleDeleteClick = (category: Category) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;

    try {
      // Call the RTK Query delete mutation
      await deleteCategory(categoryToDelete.id).unwrap();

      // Show success toast
      toast.success("Category deleted", {
        description: `"${categoryToDelete.name}" has been deleted successfully.`,
      });

      // Reset state
      setCategoryToDelete(null);
      setDeleteDialogOpen(false);
    } catch (error) {
      console.log("Failed to delete category:", error);
      const err = error as { message?: string };
      // Show error toast
      toast.error("Delete failed", {
        description:
          err?.message ||
          "There was an error deleting the category. Please try again.",
      });
    }
  };

  // Define columns for the category table
  const columns = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }: { row: { original: Category } }) => (
        <div className="font-medium">{row.original.name}</div>
      ),
    },
    {
      accessorKey: "slug",
      header: "Slug",
      cell: ({ row }: { row: { original: Category } }) => (
        <div>{row.original.slug}</div>
      ),
    },
    {
      accessorKey: "icon",
      header: "Icon",
      cell: ({ row }: { row: { original: Category } }) => (
        <div>{row.original.icon}</div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: { row: { original: Category } }) => (
        <Badge
          variant={row.original.status === "active" ? "default" : "destructive"}
        >
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "parent_id",
      header: "Parent",
      cell: ({ row }: { row: { original: Category } }) => (
        <div>{row.original.parent_id ? "Yes" : "No"}</div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }: { row: { original: Category } }) => (
        <div>
          {formatDistanceToNow(new Date(row.original.created_at), {
            addSuffix: true,
          })}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }: { row: { original: Category } }) => (
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/categories/${row.original.id}/edit`}>
              <Pencil className="h-4 w-4 mr-1" /> Edit
            </Link>
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleDeleteClick(row.original)}
            disabled={isDeleting && categoryToDelete?.id === row.original.id}
          >
            {isDeleting && categoryToDelete?.id === row.original.id ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-1" /> Delete
              </>
            )}
          </Button>
        </div>
      ),
    },
  ];

  // Initialize the table
  const table = useReactTable({
    data: categoriesData?.items || [],
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    manualPagination: true,
    pageCount: categoriesData?.meta?.totalPages || 0,
    autoResetPageIndex: false,
  });

  // Handle pagination manually since we're using API pagination
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < (categoriesData?.meta?.totalPages || 1)) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  return (
    <DashboardLayout
      breadcrumbItems={breadcrumbItems}
      title="Categories"
      actions={actionButtons}
    >
      <div>
        <div className="flex items-center py-4">
          <Input
            placeholder="Search categories..."
            value={categorySearchQuery}
            onChange={(event) => setCategorySearchQuery(event.target.value)}
            className="max-w-sm"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                Columns <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {categoriesLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    <div className="flex justify-center items-center">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      Loading categories...
                    </div>
                  </TableCell>
                </TableRow>
              ) : categoriesData?.items?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No categories found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between space-x-2 py-4 items-center">
          <div className="flex-1 text-sm text-muted-foreground">
            Showing {categoriesData?.items?.length || 0} of{" "}
            {categoriesData?.meta?.totalItems || 0} categories
          </div>
          <div className="space-x-2 flex items-center">
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {categoriesData?.meta?.totalPages || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={currentPage <= 1 || categoriesLoading}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={
                currentPage >= (categoriesData?.meta?.totalPages || 1) ||
                categoriesLoading
              }
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the category &quot;
              {categoryToDelete?.name}&quot;. This action cannot be undone.
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
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Deleting...
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
