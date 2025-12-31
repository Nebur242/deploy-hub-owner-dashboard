"use client";

import { useState, useMemo } from "react";
import { useGetCustomersQuery, CustomerStats } from "@/store/features/orders";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    IconSearch,
    IconRefresh,
    IconEye,
    IconUsers,
    IconCurrencyDollar,
    IconShoppingCart,
    IconUserPlus,
} from "@tabler/icons-react";
import Link from "next/link";
import DashboardLayout from "@/components/dashboard-layout";
import { BreadcrumbItem } from "@/components/breadcrumb";
import { formatCurrency, formatDate } from "@/utils/format";

const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Customers", href: "/dashboard/customers" },
];

export default function CustomersPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState("totalSpent");
    const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    const { data, isLoading, isFetching, refetch } = useGetCustomersQuery({
        search: searchTerm || undefined,
        sortBy,
        sortDirection,
        page: currentPage,
        limit: itemsPerPage,
    });

    const customers = useMemo(() => data?.items || [], [data?.items]);
    const totalCustomers = data?.meta?.totalItems || 0;
    const totalPages = data?.meta?.totalPages || 1;

    // Calculate summary stats from customers
    const summaryStats = useMemo(() => {
        const allCustomers = customers;
        return {
            totalCustomers: totalCustomers,
            totalRevenue: allCustomers.reduce((sum, c) => sum + c.totalSpent, 0),
            totalOrders: allCustomers.reduce((sum, c) => sum + c.totalOrders, 0),
            avgOrderValue:
                allCustomers.length > 0
                    ? allCustomers.reduce((sum, c) => sum + c.totalSpent, 0) /
                    allCustomers.reduce((sum, c) => sum + c.totalOrders, 0)
                    : 0,
        };
    }, [customers, totalCustomers]);

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

    const getCustomerInitials = (customer: CustomerStats) => {
        if (customer.firstName && customer.lastName) {
            return `${customer.firstName[0]}${customer.lastName[0]}`.toUpperCase();
        }
        if (customer.email) {
            return customer.email[0].toUpperCase();
        }
        return "?";
    };

    const getCustomerName = (customer: CustomerStats) => {
        if (customer.firstName || customer.lastName) {
            return `${customer.firstName} ${customer.lastName}`.trim();
        }
        return customer.email;
    };

    return (
        <DashboardLayout breadcrumbItems={breadcrumbItems}>
            <div className="flex flex-col gap-4 md:gap-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Customer Management
                        </h1>
                        <p className="text-muted-foreground">
                            View and manage customers who purchased your licenses
                        </p>
                    </div>
                    <Button variant="outline" onClick={() => refetch()}>
                        <IconRefresh className="mr-2 h-4 w-4" />
                        Refresh
                    </Button>
                </div>

                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Customers
                            </CardTitle>
                            <IconUsers className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <Skeleton className="h-8 w-20" />
                            ) : (
                                <div className="text-2xl font-bold">{totalCustomers}</div>
                            )}
                            <p className="text-xs text-muted-foreground">
                                Unique buyers of your licenses
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Revenue
                            </CardTitle>
                            <IconCurrencyDollar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <Skeleton className="h-8 w-24" />
                            ) : (
                                <div className="text-2xl font-bold">
                                    {formatCurrency("USD", summaryStats.totalRevenue)}
                                </div>
                            )}
                            <p className="text-xs text-muted-foreground">
                                From completed orders
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                            <IconShoppingCart className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <Skeleton className="h-8 w-16" />
                            ) : (
                                <div className="text-2xl font-bold">
                                    {summaryStats.totalOrders}
                                </div>
                            )}
                            <p className="text-xs text-muted-foreground">All time purchases</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
                            <IconUserPlus className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <Skeleton className="h-8 w-20" />
                            ) : (
                                <div className="text-2xl font-bold">
                                    {formatCurrency("USD", summaryStats.avgOrderValue || 0)}
                                </div>
                            )}
                            <p className="text-xs text-muted-foreground">Per order average</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <div className="relative">
                            <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search by name or email..."
                                className="pl-8 w-full sm:w-[300px]"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                            />
                        </div>
                        <Select
                            value={sortBy}
                            onValueChange={(value) => {
                                setSortBy(value);
                                setCurrentPage(1);
                            }}
                        >
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="totalSpent">Total Spent</SelectItem>
                                <SelectItem value="totalOrders">Order Count</SelectItem>
                                <SelectItem value="lastPurchase">Last Purchase</SelectItem>
                                <SelectItem value="firstPurchase">First Purchase</SelectItem>
                                <SelectItem value="email">Email</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select
                            value={sortDirection}
                            onValueChange={(value: "ASC" | "DESC") => {
                                setSortDirection(value);
                                setCurrentPage(1);
                            }}
                        >
                            <SelectTrigger className="w-full sm:w-[120px]">
                                <SelectValue placeholder="Order" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="DESC">Descending</SelectItem>
                                <SelectItem value="ASC">Ascending</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Customers Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Customers</CardTitle>
                        <CardDescription>
                            {totalCustomers} customer{totalCustomers !== 1 ? "s" : ""} found
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="space-y-2">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Skeleton key={i} className="h-12 w-full" />
                                ))}
                            </div>
                        ) : customers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <IconUsers className="h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold">No customers yet</h3>
                                <p className="text-muted-foreground">
                                    When someone purchases your licenses, they&apos;ll appear here.
                                </p>
                            </div>
                        ) : (
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Customer</TableHead>
                                            <TableHead className="hidden md:table-cell">
                                                Email
                                            </TableHead>
                                            <TableHead className="text-right">Orders</TableHead>
                                            <TableHead className="text-right hidden sm:table-cell">
                                                Total Spent
                                            </TableHead>
                                            <TableHead className="hidden lg:table-cell">
                                                First Purchase
                                            </TableHead>
                                            <TableHead className="hidden lg:table-cell">
                                                Last Purchase
                                            </TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {customers.map((customer) => (
                                            <TableRow key={customer.userId}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarImage
                                                                src={customer.profilePicture || undefined}
                                                                alt={getCustomerName(customer)}
                                                            />
                                                            <AvatarFallback>
                                                                {getCustomerInitials(customer)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">
                                                                {getCustomerName(customer)}
                                                            </span>
                                                            <span className="text-sm text-muted-foreground md:hidden">
                                                                {customer.email}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell">
                                                    {customer.email}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <span className="font-medium">
                                                        {customer.totalOrders}
                                                    </span>
                                                    <span className="text-muted-foreground text-sm">
                                                        {" "}
                                                        ({customer.completedOrders} completed)
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right hidden sm:table-cell">
                                                    <span className="font-medium">
                                                        {formatCurrency("USD", customer.totalSpent)}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="hidden lg:table-cell">
                                                    {customer.firstPurchase
                                                        ? formatDate(customer.firstPurchase)
                                                        : "-"}
                                                </TableCell>
                                                <TableCell className="hidden lg:table-cell">
                                                    {customer.lastPurchase
                                                        ? formatDate(customer.lastPurchase)
                                                        : "-"}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Link href={`/dashboard/customers/${customer.userId}`}>
                                                        <Button variant="ghost" size="sm">
                                                            <IconEye className="h-4 w-4" />
                                                            <span className="sr-only">View</span>
                                                        </Button>
                                                    </Link>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}

                        {/* Pagination */}
                        {customers.length > 0 && (
                            <div className="flex items-center justify-between px-2 py-4">
                                <div className="text-sm text-muted-foreground">
                                    Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                                    {Math.min(currentPage * itemsPerPage, totalCustomers)} of{" "}
                                    {totalCustomers} customers
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handlePreviousPage}
                                        disabled={currentPage <= 1 || isFetching}
                                    >
                                        Previous
                                    </Button>
                                    <div className="text-sm">
                                        Page {currentPage} of {totalPages}
                                    </div>
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
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
