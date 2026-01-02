"use client";

import { useState, useMemo } from "react";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  IconRefresh,
  IconTrendingUp,
  IconTrendingDown,
  IconCurrencyDollar,
  IconReceipt,
  IconShoppingCart,
  IconPercentage,
  IconLicense,
  IconPackage,
} from "@tabler/icons-react";
import Link from "next/link";
import DashboardLayout from "@/components/dashboard-layout";
import { BreadcrumbItem } from "@/components/breadcrumb";
import { formatCurrency } from "@/utils/format";
import {
  useGetSalesAnalyticsQuery,
  useGetSalesTrendsQuery,
  useGetTopSellingLicensesQuery,
  useGetRecentOwnerOrdersQuery,
} from "@/store/features/orders";

type Period = "7d" | "30d" | "90d" | "1y";

const periodOptions: { value: Period; label: string; days: number }[] = [
  { value: "7d", label: "Last 7 days", days: 7 },
  { value: "30d", label: "Last 30 days", days: 30 },
  { value: "90d", label: "Last 90 days", days: 90 },
  { value: "1y", label: "Last year", days: 365 },
];

const revenueChartConfig: ChartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--chart-1))",
  },
  orderCount: {
    label: "Orders",
    color: "hsl(var(--chart-2))",
  },
};

const topLicensesChartConfig: ChartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--chart-1))",
  },
  orderCount: {
    label: "Orders",
    color: "hsl(var(--chart-2))",
  },
};

function getDateRange(period: Period): { startDate: string; endDate: string } {
  const endDate = new Date();
  const startDate = new Date();
  const days = periodOptions.find((p) => p.value === period)?.days || 30;
  startDate.setDate(startDate.getDate() - days);
  // Set start of day for startDate
  startDate.setHours(0, 0, 0, 0);
  // Add 1 day to endDate for timezone tolerance (server might be in different timezone)
  endDate.setDate(endDate.getDate() + 1);
  endDate.setHours(23, 59, 59, 999);

  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  };
}

function getGroupBy(period: Period): "day" | "week" | "month" {
  switch (period) {
    case "7d":
      return "day";
    case "30d":
      return "day";
    case "90d":
      return "week";
    case "1y":
      return "month";
    default:
      return "day";
  }
}

const breadcrumbItems: BreadcrumbItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Analytics", href: "/dashboard/analytics" },
];

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>("30d");

  const dateRange = useMemo(() => getDateRange(period), [period]);
  const groupBy = useMemo(() => getGroupBy(period), [period]);

  const {
    data: analytics,
    isLoading: analyticsLoading,
    refetch: refetchAnalytics,
  } = useGetSalesAnalyticsQuery(dateRange);

  const {
    data: trends,
    isLoading: trendsLoading,
    refetch: refetchTrends,
  } = useGetSalesTrendsQuery({
    ...dateRange,
    groupBy,
  });

  const {
    data: topLicenses,
    isLoading: topLicensesLoading,
    refetch: refetchTopLicenses,
  } = useGetTopSellingLicensesQuery({
    limit: 5,
    ...dateRange,
  });

  const {
    data: recentOrders,
    isLoading: recentOrdersLoading,
    refetch: refetchRecentOrders,
  } = useGetRecentOwnerOrdersQuery({ limit: 5 });

  const isLoading = analyticsLoading || trendsLoading || topLicensesLoading || recentOrdersLoading;

  const handleRefresh = () => {
    refetchAnalytics();
    refetchTrends();
    refetchTopLicenses();
    refetchRecentOrders();
  };

  // Format trend data for chart
  const chartData = useMemo(() => {
    if (!trends) return [];
    return trends.map((t) => ({
      date: t.date,
      revenue: t.revenue,
      orderCount: t.orderCount,
    }));
  }, [trends]);

  // Format top licenses data for bar chart
  const topLicensesData = useMemo(() => {
    if (!topLicenses) return [];
    return topLicenses.map((l) => ({
      name: l.licenseName.length > 15 ? l.licenseName.slice(0, 15) + "..." : l.licenseName,
      fullName: l.licenseName,
      revenue: l.revenue,
      orderCount: l.orderCount,
    }));
  }, [topLicenses]);

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">Completed</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">Pending</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">Failed</Badge>;
      case "cancelled":
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100">Cancelled</Badge>;
      case "refunded":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">Refunded</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout breadcrumbItems={breadcrumbItems}>
      <div className="flex flex-col gap-4 md:gap-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Sales Analytics</h1>
            <p className="text-muted-foreground">
              Track your sales performance and revenue
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                {periodOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <IconRefresh className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Revenue */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <IconCurrencyDollar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {formatCurrency("USD", analytics?.totalRevenue || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    +${analytics?.pendingRevenue?.toFixed(2) || "0.00"} pending
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Total Orders */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <IconShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{analytics?.totalOrders || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {analytics?.completedOrders || 0} completed
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Average Order Value */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
              <IconReceipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {formatCurrency("USD", analytics?.averageOrderValue || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">Per completed order</p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Conversion Rate */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <IconPercentage className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {analytics?.conversionRate?.toFixed(1) || 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {analytics?.pendingOrders || 0} pending, {analytics?.failedOrders || 0} failed
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Revenue Trend Chart */}
          <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
              <CardTitle>Revenue Over Time</CardTitle>
              <CardDescription>
                Revenue and order count trends for the selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              {trendsLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : chartData.length > 0 ? (
                <ChartContainer config={revenueChartConfig} className="h-[300px] w-full">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return date.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        });
                      }}
                    />
                    <YAxis
                      yAxisId="revenue"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <YAxis
                      yAxisId="orders"
                      orientation="right"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value, name) => {
                            if (name === "revenue") {
                              return [`$${Number(value).toFixed(2)}`, "Revenue"];
                            }
                            return [value, "Orders"];
                          }}
                        />
                      }
                    />
                    <Area
                      yAxisId="revenue"
                      type="monotone"
                      dataKey="revenue"
                      stroke="var(--color-revenue)"
                      fill="var(--color-revenue)"
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                    <Area
                      yAxisId="orders"
                      type="monotone"
                      dataKey="orderCount"
                      stroke="var(--color-orderCount)"
                      fill="var(--color-orderCount)"
                      fillOpacity={0.1}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ChartContainer>
              ) : (
                <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                  No sales data available for this period
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Licenses and Recent Orders */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Top Selling Licenses */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconLicense className="h-5 w-5" />
                Top Selling Licenses
              </CardTitle>
              <CardDescription>Best performing licenses by revenue</CardDescription>
            </CardHeader>
            <CardContent>
              {topLicensesLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : topLicensesData.length > 0 ? (
                <ChartContainer config={topLicensesChartConfig} className="h-[250px] w-full">
                  <BarChart data={topLicensesData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tickFormatter={(value) => `$${value}`} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tickLine={false}
                      axisLine={false}
                      width={100}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value, name, props) => {
                            const fullName = props.payload?.fullName;
                            if (name === "revenue") {
                              return [`$${Number(value).toFixed(2)}`, `${fullName} Revenue`];
                            }
                            return [value, `${fullName} Orders`];
                          }}
                        />
                      }
                    />
                    <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="flex h-[250px] items-center justify-center text-muted-foreground">
                  No license sales data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <IconPackage className="h-5 w-5" />
                    Recent Sales
                  </CardTitle>
                  <CardDescription>Latest orders from your licenses</CardDescription>
                </div>
                <Link href="/dashboard/sales">
                  <Button variant="outline" size="sm">
                    View All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {recentOrdersLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : recentOrders && recentOrders.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>License</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">
                          {order.license?.name || "Unknown"}
                        </TableCell>
                        <TableCell>{formatCurrency(order.currency, order.amount)}</TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                  No recent orders
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Order Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Order Status Breakdown</CardTitle>
            <CardDescription>Overview of order statuses for the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : (
              <div className="grid gap-4 md:grid-cols-5">
                <div className="flex flex-col items-center rounded-lg border p-4">
                  <span className="text-2xl font-bold text-green-600">
                    {analytics?.completedOrders || 0}
                  </span>
                  <span className="text-sm text-muted-foreground">Completed</span>
                </div>
                <div className="flex flex-col items-center rounded-lg border p-4">
                  <span className="text-2xl font-bold text-yellow-600">
                    {analytics?.pendingOrders || 0}
                  </span>
                  <span className="text-sm text-muted-foreground">Pending</span>
                </div>
                <div className="flex flex-col items-center rounded-lg border p-4">
                  <span className="text-2xl font-bold text-red-600">
                    {analytics?.failedOrders || 0}
                  </span>
                  <span className="text-sm text-muted-foreground">Failed</span>
                </div>
                <div className="flex flex-col items-center rounded-lg border p-4">
                  <span className="text-2xl font-bold text-gray-600">
                    {analytics?.cancelledOrders || 0}
                  </span>
                  <span className="text-sm text-muted-foreground">Cancelled</span>
                </div>
                <div className="flex flex-col items-center rounded-lg border p-4">
                  <span className="text-2xl font-bold text-blue-600">
                    {analytics?.refundedOrders || 0}
                  </span>
                  <span className="text-sm text-muted-foreground">Refunded</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
