"use client";

import { use, useMemo } from "react";
import { useGetCustomerByIdQuery, CustomerDetails } from "@/store/features/orders";
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
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
    IconArrowLeft,
    IconMail,
    IconBuilding,
    IconCalendar,
    IconShoppingCart,
    IconCurrencyDollar,
    IconCheck,
    IconClock,
    IconX,
    IconRefresh,
    IconReceipt,
    IconLicense,
} from "@tabler/icons-react";
import Link from "next/link";
import DashboardLayout from "@/components/dashboard-layout";
import { BreadcrumbItem } from "@/components/breadcrumb";
import { formatCurrency, formatDate } from "@/utils/format";
import { OrderStatus } from "@/common/types/order";

const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Customers", href: "/dashboard/customers" },
    { label: "Customer Details" },
];

export default function CustomerDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);

    const { data: customer, isLoading, error, refetch } = useGetCustomerByIdQuery(id);

    const getCustomerInitials = (customer: CustomerDetails) => {
        if (customer.firstName && customer.lastName) {
            return `${customer.firstName[0]}${customer.lastName[0]}`.toUpperCase();
        }
        if (customer.email) {
            return customer.email[0].toUpperCase();
        }
        return "?";
    };

    const getCustomerName = (customer: CustomerDetails) => {
        if (customer.firstName || customer.lastName) {
            return `${customer.firstName} ${customer.lastName}`.trim();
        }
        return customer.email;
    };

    const getStatusBadge = (status: OrderStatus | string) => {
        switch (status) {
            case OrderStatus.PENDING:
                return (
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
                        <IconClock className="mr-1 h-3 w-3" />
                        Pending
                    </Badge>
                );
            case OrderStatus.COMPLETED:
                return (
                    <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                        <IconCheck className="mr-1 h-3 w-3" />
                        Completed
                    </Badge>
                );
            case OrderStatus.FAILED:
                return (
                    <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
                        <IconX className="mr-1 h-3 w-3" />
                        Failed
                    </Badge>
                );
            case OrderStatus.CANCELLED:
                return (
                    <Badge variant="outline" className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100">
                        <IconX className="mr-1 h-3 w-3" />
                        Cancelled
                    </Badge>
                );
            case OrderStatus.REFUNDED:
                return (
                    <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                        <IconRefresh className="mr-1 h-3 w-3" />
                        Refunded
                    </Badge>
                );
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    if (isLoading) {
        return (
            <DashboardLayout breadcrumbItems={breadcrumbItems}>
                <div className="flex flex-col gap-6">
                    <Skeleton className="h-8 w-48" />
                    <div className="grid gap-6 md:grid-cols-3">
                        <Skeleton className="h-48" />
                        <Skeleton className="h-48 md:col-span-2" />
                    </div>
                    <Skeleton className="h-96" />
                </div>
            </DashboardLayout>
        );
    }

    if (error || !customer) {
        return (
            <DashboardLayout breadcrumbItems={breadcrumbItems}>
                <div className="flex flex-col items-center justify-center py-12">
                    <h2 className="text-xl font-semibold mb-2">Customer not found</h2>
                    <p className="text-muted-foreground mb-4">
                        This customer may not exist or has not made any purchases from you.
                    </p>
                    <Link href="/dashboard/customers">
                        <Button>
                            <IconArrowLeft className="mr-2 h-4 w-4" />
                            Back to Customers
                        </Button>
                    </Link>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout breadcrumbItems={breadcrumbItems}>
            <div className="flex flex-col gap-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard/customers">
                            <Button variant="ghost" size="icon">
                                <IconArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12">
                                <AvatarImage
                                    src={customer.profilePicture || undefined}
                                    alt={getCustomerName(customer)}
                                />
                                <AvatarFallback className="text-lg">
                                    {getCustomerInitials(customer)}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight">
                                    {getCustomerName(customer)}
                                </h1>
                                <p className="text-muted-foreground flex items-center gap-1">
                                    <IconMail className="h-4 w-4" />
                                    {customer.email}
                                </p>
                            </div>
                        </div>
                    </div>
                    <Button variant="outline" onClick={() => refetch()}>
                        <IconRefresh className="mr-2 h-4 w-4" />
                        Refresh
                    </Button>
                </div>

                {/* Overview Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    {/* Customer Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Customer Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {customer.company && (
                                <div className="flex items-center gap-2 text-sm">
                                    <IconBuilding className="h-4 w-4 text-muted-foreground" />
                                    <span>{customer.company}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2 text-sm">
                                <IconCalendar className="h-4 w-4 text-muted-foreground" />
                                <span>Customer since {formatDate(customer.userCreatedAt)}</span>
                            </div>
                            <Separator />
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-muted-foreground">First Purchase</span>
                                    <p className="font-medium">
                                        {customer.firstPurchase
                                            ? formatDate(customer.firstPurchase)
                                            : "N/A"}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Last Purchase</span>
                                    <p className="font-medium">
                                        {customer.lastPurchase
                                            ? formatDate(customer.lastPurchase)
                                            : "N/A"}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Statistics */}
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-base">Purchase Statistics</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="flex flex-col">
                                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                                        <IconShoppingCart className="h-4 w-4" />
                                        Total Orders
                                    </span>
                                    <span className="text-2xl font-bold">
                                        {customer.totalOrders}
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                                        <IconCheck className="h-4 w-4" />
                                        Completed
                                    </span>
                                    <span className="text-2xl font-bold">
                                        {customer.completedOrders}
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                                        <IconCurrencyDollar className="h-4 w-4" />
                                        Total Spent
                                    </span>
                                    <span className="text-2xl font-bold">
                                        {formatCurrency("USD", customer.totalSpent)}
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                                        <IconLicense className="h-4 w-4" />
                                        Licenses
                                    </span>
                                    <span className="text-2xl font-bold">
                                        {customer.licensesOwned.length}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Licenses Owned */}
                {customer.licensesOwned.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <IconLicense className="h-5 w-5" />
                                Licenses Purchased
                            </CardTitle>
                            <CardDescription>
                                All licenses this customer has purchased from you
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                                {customer.licensesOwned.map((license) => (
                                    <div
                                        key={license.licenseId}
                                        className="flex items-center justify-between p-3 border rounded-lg"
                                    >
                                        <div>
                                            <p className="font-medium">{license.licenseName}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {license.purchaseCount} purchase
                                                {license.purchaseCount !== 1 ? "s" : ""}
                                            </p>
                                        </div>
                                        <Link href={`/dashboard/licenses/${license.licenseId}`}>
                                            <Button variant="ghost" size="sm">
                                                View
                                            </Button>
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Order History */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <IconReceipt className="h-5 w-5" />
                            Order History
                        </CardTitle>
                        <CardDescription>
                            All orders from this customer ({customer.orders.length} total)
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {customer.orders.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <IconReceipt className="h-12 w-12 text-muted-foreground mb-4" />
                                <p className="text-muted-foreground">No orders found</p>
                            </div>
                        ) : (
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Order ID</TableHead>
                                            <TableHead>License</TableHead>
                                            <TableHead className="hidden sm:table-cell">Date</TableHead>
                                            <TableHead className="text-right">Amount</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {customer.orders.map((order) => (
                                            <TableRow key={order.id}>
                                                <TableCell className="font-mono text-sm">
                                                    {order.id.slice(0, 8)}...
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">
                                                            {order.license?.name || "Unknown"}
                                                        </span>
                                                        {order.license?.projects?.[0] && (
                                                            <span className="text-sm text-muted-foreground">
                                                                {order.license.projects[0].name}
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="hidden sm:table-cell">
                                                    {formatDate(order.created_at)}
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {formatCurrency(order.currency || "USD", order.amount)}
                                                </TableCell>
                                                <TableCell>{getStatusBadge(order.status)}</TableCell>
                                                <TableCell className="text-right">
                                                    <Link href={`/dashboard/sales/${order.id}`}>
                                                        <Button variant="ghost" size="sm">
                                                            View
                                                        </Button>
                                                    </Link>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
