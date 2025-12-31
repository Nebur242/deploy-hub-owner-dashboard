"use client";

import { use } from "react";
import { useGetOwnerOrderByIdQuery } from "@/store/features/orders";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  IconArrowLeft,
  IconReceipt,
  IconUser,
  IconLicense,
  IconCalendar,
  IconCreditCard,
  IconMail,
  IconMapPin,
  IconBuilding,
} from "@tabler/icons-react";
import Link from "next/link";
import DashboardLayout from "@/components/dashboard-layout";
import { BreadcrumbItem } from "@/components/breadcrumb";
import { formatCurrency, formatDate } from "@/utils/format";
import { OrderStatus } from "@/common/types/order";

export default function SaleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: order, isLoading, error } = useGetOwnerOrderByIdQuery(id);

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Sales", href: "/dashboard/sales" },
    { label: order?.reference_number || "Order Details", href: `/dashboard/sales/${id}` },
  ];

  const getStatusBadge = (status: OrderStatus | string) => {
    switch (status) {
      case OrderStatus.PENDING:
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
            Pending
          </Badge>
        );
      case OrderStatus.COMPLETED:
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
            Completed
          </Badge>
        );
      case OrderStatus.FAILED:
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
            Failed
          </Badge>
        );
      case OrderStatus.CANCELLED:
        return (
          <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100">
            Cancelled
          </Badge>
        );
      case OrderStatus.REFUNDED:
        return (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
            Refunded
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getBuyerName = () => {
    if (order?.user?.firstName) {
      return `${order.user.firstName} ${order.user.lastName || ""}`.trim();
    }
    if (order?.billing?.first_name) {
      return `${order.billing.first_name} ${order.billing.last_name || ""}`.trim();
    }
    return "Unknown";
  };

  if (isLoading) {
    return (
      <DashboardLayout breadcrumbItems={breadcrumbItems}>
        <div className="flex flex-col gap-4 md:gap-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-[300px]" />
            <Skeleton className="h-[300px]" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !order) {
    return (
      <DashboardLayout breadcrumbItems={breadcrumbItems}>
        <div className="flex flex-col items-center justify-center gap-4 py-12">
          <IconReceipt className="h-16 w-16 text-muted-foreground opacity-50" />
          <h2 className="text-xl font-semibold">Order Not Found</h2>
          <p className="text-muted-foreground">
            This order doesn&apos;t exist or you don&apos;t have access to it.
          </p>
          <Link href="/dashboard/sales">
            <Button>
              <IconArrowLeft className="h-4 w-4 mr-2" />
              Back to Sales
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout breadcrumbItems={breadcrumbItems}>
      <div className="flex flex-col gap-4 md:gap-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/sales">
              <Button variant="outline" size="icon">
                <IconArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                Order #{order.reference_number || order.id.slice(0, 8)}
                {getStatusBadge(order.status)}
              </h1>
              <p className="text-muted-foreground">
                Created on {formatDate(order.created_at)}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Order Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconReceipt className="h-5 w-5" />
                Order Details
              </CardTitle>
              <CardDescription>Information about this sale</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Order ID</p>
                  <p className="font-mono text-sm">{order.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Reference</p>
                  <p className="font-medium">{order.reference_number || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(order.currency, order.amount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div className="mt-1">{getStatusBadge(order.status)}</div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <IconCalendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Created:</span>
                  <span>{formatDate(order.created_at)}</span>
                </div>
                {order.completed_at && (
                  <div className="flex items-center gap-2 text-sm">
                    <IconCalendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Completed:</span>
                    <span>{formatDate(order.completed_at)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Buyer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconUser className="h-5 w-5" />
                Buyer Information
              </CardTitle>
              <CardDescription>Customer who made this purchase</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <IconUser className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{getBuyerName()}</p>
                  <p className="text-sm text-muted-foreground">
                    {order.user?.email || order.billing?.email}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <IconMail className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="text-sm">{order.billing?.email || order.user?.email || "N/A"}</p>
                  </div>
                </div>

                {order.billing?.company && (
                  <div className="flex items-start gap-2">
                    <IconBuilding className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Company</p>
                      <p className="text-sm">{order.billing.company}</p>
                    </div>
                  </div>
                )}

                {order.billing?.city && (
                  <div className="flex items-start gap-2">
                    <IconMapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="text-sm">
                        {[order.billing.city, order.billing.state, order.billing.country]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* License Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconLicense className="h-5 w-5" />
                License Information
              </CardTitle>
              <CardDescription>The license that was purchased</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.license ? (
                <>
                  <div>
                    <p className="font-semibold text-lg">{order.license.name}</p>
                    {order.license.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {order.license.description}
                      </p>
                    )}
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Price</p>
                      <p className="font-medium">
                        {formatCurrency(order.license.currency, order.license.price)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Period</p>
                      <p className="font-medium capitalize">{order.license.period || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Deployments</p>
                      <p className="font-medium">{order.license.deployment_limit || "Unlimited"}</p>
                    </div>
                  </div>

                  {order.license.projects && order.license.projects.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Associated Project</p>
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10">
                            {order.license.projects[0].name?.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium">{order.license.projects[0].name}</span>
                        </div>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground">License information not available</p>
              )}
            </CardContent>
          </Card>

          {/* Payment History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconCreditCard className="h-5 w-5" />
                Payment History
              </CardTitle>
              <CardDescription>Payments associated with this order</CardDescription>
            </CardHeader>
            <CardContent>
              {order.payments && order.payments.length > 0 ? (
                <div className="space-y-3">
                  {order.payments.map((payment, index) => (
                    <div
                      key={payment.id || index}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div>
                        <p className="font-medium">
                          {formatCurrency(payment.currency, payment.amount)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {payment.payment_method} • {formatDate(payment.created_at)}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          payment.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : payment.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                        }
                      >
                        {payment.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No payment records found
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
