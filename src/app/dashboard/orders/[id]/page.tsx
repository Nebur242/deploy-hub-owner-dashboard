"use client";

import { useGetOrderByIdQuery } from "@/store/features/orders";
import { OrderStatus, PaymentStatus } from "@/common/types/order";
import { LicensePeriod } from "@/common/types/license";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import DashboardLayout from "@/components/dashboard-layout";
import { BreadcrumbItem } from "@/components/breadcrumb";
import { IconArrowLeft, IconCreditCard, IconReceipt } from "@tabler/icons-react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/utils/format";
import { useParams, useRouter } from "next/navigation";
import { downloadInvoice } from "@/services/invoice";
import { toast } from "sonner";

export default function OrderDetails() {

    const { id } = useParams<{ id: string }>();

    const router = useRouter();
    const { data: order, isLoading, error } = useGetOrderByIdQuery(id);

    const handleContinuePayment = () => {
        router.push(`/dashboard/payment?orderId=${id}`);
    };

    const handleDownloadInvoice = async () => {
        if (!order) return;

        try {
            await downloadInvoice(order);
            toast.success("Invoice downloaded successfully");
        } catch (error) {
            console.error("Error downloading invoice:", error);
            toast.error("Failed to download invoice. Please try again.");
        }
    };

    const getBadgeForOrderStatus = (status: OrderStatus) => {
        switch (status) {
            case OrderStatus.PENDING:
                return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Pending</Badge>;
            case OrderStatus.COMPLETED:
                return <Badge className="bg-green-100 text-green-800 border-green-300">Completed</Badge>;
            case OrderStatus.CANCELLED:
                return <Badge className="bg-gray-100 text-gray-800 border-gray-300">Cancelled</Badge>;
            case OrderStatus.REFUNDED:
                return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Refunded</Badge>;
            case OrderStatus.FAILED:
                return <Badge className="bg-red-100 text-red-800 border-red-300">Failed</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    };

    const getBadgeForPaymentStatus = (status: PaymentStatus) => {
        switch (status) {
            case PaymentStatus.PENDING:
                return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Pending</Badge>;
            case PaymentStatus.COMPLETED:
                return <Badge className="bg-green-100 text-green-800 border-green-300">Completed</Badge>;
            case PaymentStatus.FAILED:
                return <Badge className="bg-red-100 text-red-800 border-red-300">Failed</Badge>;
            case PaymentStatus.REFUNDED:
                return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Refunded</Badge>;
            case PaymentStatus.CANCELLED:
                return <Badge className="bg-gray-100 text-gray-800 border-gray-300">Cancelled</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    };

    // Breadcrumb items
    const breadcrumbItems: BreadcrumbItem[] = [
        { label: "Orders", href: "/dashboard/orders" },
        { label: order ? `Order #${order.id}` : "Order Details" },
    ];

    // Loading state
    if (isLoading) {
        return (
            <DashboardLayout
                breadcrumbItems={breadcrumbItems}
                title="Order Details"
                actions={
                    <Button variant="ghost" asChild>
                        <Link href="/dashboard/orders">
                            <IconArrowLeft className="mr-2 h-4 w-4" /> Back to Orders
                        </Link>
                    </Button>
                }
            >
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Order Summary Card - Loading */}
                        <Card className="md:col-span-2">
                            <CardHeader>
                                <Skeleton className="h-8 w-1/3 mb-2" />
                                <Skeleton className="h-4 w-2/3" />
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <Skeleton className="h-20 w-full" />
                                        <Skeleton className="h-20 w-full" />
                                    </div>
                                    <Skeleton className="h-40 w-full" />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Payment Summary - Loading */}
                        <Card>
                            <CardHeader>
                                <Skeleton className="h-6 w-1/2 mb-2" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-40 w-full" />
                            </CardContent>
                            <CardFooter>
                                <Skeleton className="h-10 w-full" />
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    // Error state
    if (error || !order) {
        return (
            <DashboardLayout
                breadcrumbItems={breadcrumbItems}
                title="Order Details"
                actions={
                    <Button variant="ghost" asChild>
                        <Link href="/dashboard/orders">
                            <IconArrowLeft className="mr-2 h-4 w-4" /> Back to Orders
                        </Link>
                    </Button>
                }
            >
                <Card>
                    <CardHeader>
                        <CardTitle>Error</CardTitle>
                        <CardDescription>
                            There was an error loading the order details.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p>Unable to fetch the order with ID: {id}</p>
                    </CardContent>
                    <CardFooter>
                        <Button asChild>
                            <Link href="/dashboard/orders">Back to Orders</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            breadcrumbItems={breadcrumbItems}
            title={`Order #${order.id}`}
            actions={
                <Button variant="ghost" asChild>
                    <Link href="/dashboard/orders">
                        <IconArrowLeft className="mr-2 h-4 w-4" /> Back to Orders
                    </Link>
                </Button>
            }
        >
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Order Summary Card */}
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Order Summary</CardTitle>
                                {getBadgeForOrderStatus(order.status)}
                            </div>
                            <CardDescription>
                                Created on {formatDate(order.created_at)}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {/* Order Details */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500">Reference Number</h3>
                                        <p className="mt-1 font-medium">{order.id}</p>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500">Amount</h3>
                                        <p className="mt-1 font-medium">{formatCurrency(order.currency, order.amount)}</p>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500">Created</h3>
                                        <p className="mt-1">{formatDate(order.created_at)}</p>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
                                        <p className="mt-1">{formatDate(order.updated_at)}</p>
                                    </div>
                                    {order.completed_at && (
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-500">Completed</h3>
                                            <p className="mt-1">{formatDate(order.completed_at)}</p>
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500">Active</h3>
                                        <p className="mt-1">{order.is_active ? "Yes" : "No"}</p>
                                    </div>
                                    {order.expires_at && (
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-500">Expires</h3>
                                            <p className="mt-1">{formatDate(order.expires_at)}</p>
                                        </div>
                                    )}
                                </div>

                                <Separator />

                                {/* License Details */}
                                <div>
                                    <h3 className="font-medium mb-2">License Details</h3>
                                    {order.license ? (
                                        <div className="bg-gray-50 p-4 rounded-md">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="font-medium">{order.license.name}</h4>
                                                <Badge variant="outline">{formatCurrency(order.currency, order.license.price)}</Badge>
                                            </div>
                                            <p className="text-sm text-gray-600 mb-4">{order.license.description}</p>
                                            <div className="flex flex-wrap gap-2">
                                                <Badge variant="secondary">{order.license.deployment_limit} deployments</Badge>
                                                <Badge variant="secondary">
                                                    {order.license.period === LicensePeriod.FOREVER
                                                        ? "Lifetime"
                                                        : order.license.period.charAt(0).toUpperCase() + order.license.period.slice(1)}
                                                </Badge>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500">License details not available</p>
                                    )}
                                </div>

                                {/* Notes */}
                                {order.notes && (
                                    <>
                                        <Separator />
                                        <div>
                                            <h3 className="font-medium mb-2">Notes</h3>
                                            <p className="text-sm">{order.notes}</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payment Summary */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Payment Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Subtotal</span>
                                    <span>{formatCurrency(order.currency, order.amount)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Tax</span>
                                    <span>{formatCurrency(order.currency, 0)}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between font-medium">
                                    <span>Total</span>
                                    <span>{formatCurrency(order.currency, order.amount)}</span>
                                </div>

                                {/* Payment Status */}
                                <div className="mt-4 pt-4 border-t">
                                    <h4 className="text-sm font-medium mb-3">Payment Status</h4>
                                    {order.payments && order.payments.length > 0 ? (
                                        <div className="space-y-3">
                                            {order.payments.map((payment) => (
                                                <div key={payment.id} className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm font-medium">
                                                            {payment.payment_method.replace('_', ' ')}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {payment.processed_at
                                                                ? formatDate(payment.processed_at)
                                                                : formatDate(payment.created_at)}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <span className="mr-2">{formatCurrency(payment.currency, payment.amount)}</span>
                                                        {getBadgeForPaymentStatus(payment.status)}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-3">
                                            <p className="text-sm text-gray-500">No payment records found</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-2">
                            {order.status === OrderStatus.PENDING && (
                                <Button className="w-full" onClick={handleContinuePayment}>
                                    <IconCreditCard className="mr-2 h-4 w-4" />
                                    Complete Payment
                                </Button>
                            )}
                            {order.status === OrderStatus.COMPLETED && (
                                <Button
                                    variant="outline"
                                    className="w-full text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                                    onClick={handleDownloadInvoice}
                                >
                                    <IconReceipt className="mr-2 h-4 w-4" />
                                    Download Invoice
                                </Button>
                            )}
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}