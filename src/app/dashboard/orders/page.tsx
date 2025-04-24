"use client";

import { useState, useEffect } from "react";
import { useGetOrdersQuery } from "@/store/features/orders";
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
import { Order, OrderStatus } from "@/common/types/order";
import {
    IconSearch,
    IconLoader,
    IconRefresh,
    IconCreditCard,
    IconAlertCircle,
    IconExclamationMark,
    IconReceipt,
} from "@tabler/icons-react";
import Link from "next/link";
import DashboardLayout from "@/components/dashboard-layout";
import { BreadcrumbItem } from "@/components/breadcrumb";
import { formatCurrency, formatDate } from "@/utils/format";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { downloadInvoice } from "@/services/invoice";
import { toast } from "sonner";

export default function OrdersPage() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [hasPendingOrders, setHasPendingOrders] = useState(false);

    const { data, isLoading, isFetching, error, refetch } = useGetOrdersQuery({
        search: searchTerm || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        page: currentPage,
        limit: itemsPerPage,
    });

    const orders = data?.items || [];
    const totalOrders = data?.meta?.totalItems || 0;
    const totalPages = data?.meta?.totalPages || 1;

    // Check if there are pending orders
    useEffect(() => {
        if (orders && orders.length > 0) {
            const pendingOrders = orders.some(order => order.status === OrderStatus.PENDING);
            setHasPendingOrders(pendingOrders);
        }
    }, [orders]);

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

    const handleContinuePayment = (orderId: string) => {
        router.push(`/dashboard/payment?orderId=${orderId}`);
    };

    const handleDownloadInvoice = async (order: Order) => {
        try {
            await downloadInvoice(order);
            toast.success("Invoice downloaded successfully");
        } catch (error) {
            console.error("Error downloading invoice:", error);
            toast.error("Failed to download invoice. Please try again.");
        }
    };

    const getOrderStatusBadge = (status: OrderStatus) => {
        switch (status) {
            case OrderStatus.PENDING:
                return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
            case OrderStatus.COMPLETED:
                return <Badge variant="outline" className="bg-green-100 text-green-800">Completed</Badge>;
            case OrderStatus.CANCELLED:
                return <Badge variant="outline" className="bg-gray-100 text-gray-800">Cancelled</Badge>;
            case OrderStatus.REFUNDED:
                return <Badge variant="outline" className="bg-blue-100 text-blue-800">Refunded</Badge>;
            case OrderStatus.FAILED:
                return <Badge variant="outline" className="bg-red-100 text-red-800">Failed</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    // Breadcrumb items
    const breadcrumbItems: BreadcrumbItem[] = [{ label: "Orders" }];

    // Action buttons for the header
    const actionButtons = (
        <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <IconRefresh
                className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`}
            />
            {isFetching ? "Refreshing..." : "Refresh"}
        </Button>
    );

    // Find first pending order to highlight
    const firstPendingOrder = orders.find(order => order.status === OrderStatus.PENDING);

    return (
        <DashboardLayout
            breadcrumbItems={breadcrumbItems}
            title="Orders"
            actions={actionButtons}
        >
            <div className="flex flex-col gap-6">
                {hasPendingOrders && statusFilter !== OrderStatus.PENDING && (
                    <Alert variant='default' className="bg-amber-50 border border-amber-200 text-amber-900">
                        <IconAlertCircle className="h-5 w-5 text-amber-600" />
                        <AlertTitle className="font-medium text-amber-800">You have pending orders</AlertTitle>
                        <AlertDescription className="flex justify-between items-center mt-1">
                            <span>Complete your payment to activate your licenses.</span>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setStatusFilter(OrderStatus.PENDING)}
                                    className="border-amber-500 text-amber-700 hover:bg-amber-100"
                                >
                                    View Pending Orders
                                </Button>
                                {firstPendingOrder && (
                                    <Button
                                        size="sm"
                                        onClick={() => handleContinuePayment(firstPendingOrder.id)}
                                        className="bg-amber-600 text-white hover:bg-amber-700"
                                    >
                                        <IconCreditCard className="h-4 w-4 mr-1" />
                                        Proceed to Payment
                                    </Button>
                                )}
                            </div>
                        </AlertDescription>
                    </Alert>
                )}

                <div className="flex gap-4 flex-col sm:flex-row mb-4">
                    <div className="relative w-full sm:w-1/3">
                        <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search orders..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1); // Reset to first page on search
                            }}
                        />
                    </div>
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
                            <SelectItem value={OrderStatus.PENDING}>Pending</SelectItem>
                            <SelectItem value={OrderStatus.COMPLETED}>Completed</SelectItem>
                            <SelectItem value={OrderStatus.CANCELLED}>Cancelled</SelectItem>
                            <SelectItem value={OrderStatus.REFUNDED}>Refunded</SelectItem>
                            <SelectItem value={OrderStatus.FAILED}>Failed</SelectItem>
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
                            Error loading orders. Please try again.
                        </p>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-4 py-12">
                        <p className="text-muted-foreground">No orders found.</p>
                        <Link href="/dashboard/purchase">
                            <Button>
                                Browse Licenses
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Reference Number</TableHead>
                                        <TableHead>License</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {orders.map((order) => (
                                        <TableRow
                                            key={order.id}
                                            className={order.status === OrderStatus.PENDING ? "bg-amber-50" : ""}
                                        >
                                            <TableCell className="font-medium">
                                                {order.referenceNumber || order.id}
                                            </TableCell>
                                            <TableCell>
                                                {order.license?.name || "Unknown License"}
                                            </TableCell>
                                            <TableCell>
                                                {formatCurrency(order.currency, order.amount)}
                                            </TableCell>
                                            <TableCell>
                                                {formatDate(order.createdAt)}
                                            </TableCell>
                                            <TableCell>
                                                {order.status === OrderStatus.PENDING ? (
                                                    <Badge className="bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                                                        <IconExclamationMark className="h-3 w-3" /> Pending
                                                    </Badge>
                                                ) : (
                                                    getOrderStatusBadge(order.status)
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end space-x-1">
                                                    {order.status === OrderStatus.PENDING && (
                                                        <Button
                                                            size="sm"
                                                            className="bg-blue-600 text-white hover:bg-blue-700"
                                                            onClick={() => handleContinuePayment(order.id)}
                                                        >
                                                            <IconCreditCard className="h-4 w-4 mr-1" /> Pay Now
                                                        </Button>
                                                    )}
                                                    {order.status === OrderStatus.COMPLETED && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                            onClick={() => handleDownloadInvoice(order)}
                                                        >
                                                            <IconReceipt className="h-4 w-4 mr-1" /> Invoice
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        asChild
                                                        className="text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50"
                                                    >
                                                        <Link href={`/dashboard/orders/${order.id}`}>
                                                            Details
                                                        </Link>
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
                                Showing {orders.length} of {totalOrders} orders
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
        </DashboardLayout>
    );
}