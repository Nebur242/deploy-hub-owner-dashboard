"use client";

import { useState } from "react";
import {
    useGetLicensesQuery,
    useDeleteLicenseMutation,
} from "@/store/features/licenses";
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
import { Currency } from "@/common/enums/project";
import {
    IconPlus,
    IconSearch,
    IconLoader,
    IconRefresh,
    IconEdit,
    IconTrash,
    IconEye,
} from "@tabler/icons-react";
import Link from "next/link";
import DashboardLayout from "@/components/dashboard-layout";
import { BreadcrumbItem } from "@/components/breadcrumb";
import { toast } from "sonner";
import { LicenseOption } from "@/common/types";
import { formatCurrency, formatDuration } from "@/utils/format";

export default function LicensesPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [currencyFilter, setCurrencyFilter] = useState<string>("all");
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [licenseToDelete, setLicenseToDelete] = useState<LicenseOption | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    const { data, isLoading, isFetching, error, refetch } = useGetLicensesQuery({
        search: searchTerm || undefined,
        currency: currencyFilter !== "all" ? currencyFilter : undefined,
        page: currentPage,
        limit: itemsPerPage,
    });

    // Delete license mutation
    const [deleteLicense, { isLoading: isDeleting }] = useDeleteLicenseMutation();

    const licenses = data?.items || [];
    const totalLicenses = data?.meta?.totalItems || 0;
    const totalPages = data?.meta?.totalPages || 1;

    // For handling delete confirmation
    const handleDeleteClick = (license: LicenseOption) => {
        setLicenseToDelete(license);
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

    const handleConfirmDelete = async () => {
        if (!licenseToDelete) return;

        try {
            // Call the RTK Query delete mutation
            await deleteLicense(licenseToDelete.id).unwrap();

            // Show success toast
            toast.success("License deleted", {
                description: `"${licenseToDelete.name}" has been deleted successfully.`,
            });

            // Reset state
            setLicenseToDelete(null);
            setDeleteDialogOpen(false);
        } catch (error) {
            console.error("Failed to delete license:", error);
            const err = error as { message?: string };
            // Show error toast
            toast.error("Delete failed", {
                description:
                    err?.message ||
                    "There was an error deleting the license. Please try again.",
            });
        }
    };

    // Breadcrumb items
    const breadcrumbItems: BreadcrumbItem[] = [{ label: "Licenses" }];

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
                <Link href="/dashboard/licenses/create">
                    <IconPlus className="h-4 w-4 mr-2" /> Create License
                </Link>
            </Button>
        </>
    );

    return (
        <DashboardLayout
            breadcrumbItems={breadcrumbItems}
            title="Licenses"
            actions={actionButtons}
        >
            <div className="flex flex-col gap-6">
                <div className="flex gap-4 flex-col sm:flex-row mb-4">
                    <div className="relative w-full sm:w-1/3">
                        <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search licenses..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1); // Reset to first page on search
                            }}
                        />
                    </div>
                    <Select
                        value={currencyFilter}
                        onValueChange={(value) => {
                            setCurrencyFilter(value);
                            setCurrentPage(1); // Reset to first page on filter change
                        }}
                    >
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Currency" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Currencies</SelectItem>
                            <SelectItem value={Currency.USD}>USD</SelectItem>
                            <SelectItem value={Currency.EUR}>EUR</SelectItem>
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
                            Error loading licenses. Please try again.
                        </p>
                    </div>
                ) : licenses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-4 py-12">
                        <p className="text-muted-foreground">No licenses found.</p>
                        <Link href="/dashboard/licenses/create">
                            <Button>
                                <IconPlus className="mr-2 h-4 w-4" />
                                Create your first license
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
                                        <TableHead>Price</TableHead>
                                        <TableHead>Deployments</TableHead>
                                        <TableHead>Duration</TableHead>
                                        <TableHead>Projects</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {licenses.map((license) => (
                                        <TableRow key={license.id}>
                                            <TableCell className="font-medium">
                                                {license.name}
                                            </TableCell>
                                            <TableCell className="max-w-[300px] truncate">
                                                {license.description}
                                            </TableCell>
                                            <TableCell>
                                                {formatCurrency(license.currency, license.price)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">
                                                    {license.deploymentLimit} {license.deploymentLimit === 1 ? 'deployment' : 'deployments'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {formatDuration(license.duration)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">
                                                    {license.projects?.length || 0} {license.projects?.length === 1 ? 'project' : 'projects'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end space-x-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        asChild
                                                        className="text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50"
                                                    >
                                                        <Link href={`/dashboard/licenses/${license.id}`}>
                                                            <IconEye className="h-4 w-4 mr-1" /> View
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        asChild
                                                        className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                                    >
                                                        <Link
                                                            href={`/dashboard/licenses/${license.id}/edit`}
                                                        >
                                                            <IconEdit className="h-4 w-4 mr-1" /> Edit
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => handleDeleteClick(license)}
                                                        disabled={
                                                            isDeleting && licenseToDelete?.id === license.id
                                                        }
                                                    >
                                                        {isDeleting &&
                                                            licenseToDelete?.id === license.id ? (
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
                        <div className="flex items-center justify-between space-x-2 py-4 items-center">
                            <div className="flex-1 text-sm text-muted-foreground">
                                Showing {licenses.length} of {totalLicenses} licenses
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
            <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => {
                setDeleteDialogOpen(open);
                if (!open) {
                    setLicenseToDelete(null);
                }
            }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the license &quot;
                            {licenseToDelete?.name}&quot;. This action cannot be undone.
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