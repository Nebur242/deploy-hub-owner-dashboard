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
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  IconRefresh,
  IconCurrencyDollar,
  IconWallet,
  IconTrendingUp,
  IconReceipt,
  IconArrowUp,
  IconArrowDown,
  IconCalendar,
  IconPercentage,
} from "@tabler/icons-react";
import Link from "next/link";
import DashboardLayout from "@/components/dashboard-layout";
import { BreadcrumbItem } from "@/components/breadcrumb";
import { formatCurrency } from "@/utils/format";
import {
  useGetSalesAnalyticsQuery,
  useGetSalesTrendsQuery,
  useGetTopSellingLicensesQuery,
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
};

const PIE_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

function getDateRange(period: Period): { startDate: string; endDate: string } {
  const endDate = new Date();
  // Add 1 day to end date to account for timezone differences
  // This ensures orders created "today" in any timezone are included
  endDate.setDate(endDate.getDate() + 1);
  endDate.setHours(23, 59, 59, 999);
  
  const startDate = new Date();
  const days = periodOptions.find((p) => p.value === period)?.days || 30;
  startDate.setDate(startDate.getDate() - days);
  // Set start date to beginning of day
  startDate.setHours(0, 0, 0, 0);

  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  };
}

function getPreviousDateRange(period: Period): { startDate: string; endDate: string } {
  const endDate = new Date();
  const startDate = new Date();
  const days = periodOptions.find((p) => p.value === period)?.days || 30;
  endDate.setDate(endDate.getDate() - days);
  endDate.setHours(23, 59, 59, 999);
  startDate.setDate(startDate.getDate() - days * 2);
  startDate.setHours(0, 0, 0, 0);

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
  { label: "Earnings", href: "/dashboard/earnings" },
];

export default function EarningsPage() {
  const [period, setPeriod] = useState<Period>("30d");

  const dateRange = useMemo(() => getDateRange(period), [period]);
  const previousDateRange = useMemo(() => getPreviousDateRange(period), [period]);
  const groupBy = useMemo(() => getGroupBy(period), [period]);

  // Current period analytics
  const {
    data: currentAnalytics,
    isLoading: currentLoading,
    refetch: refetchCurrent,
  } = useGetSalesAnalyticsQuery(dateRange);

  // Previous period analytics for comparison
  const {
    data: previousAnalytics,
    isLoading: previousLoading,
  } = useGetSalesAnalyticsQuery(previousDateRange);

  // Revenue trends
  const {
    data: trends,
    isLoading: trendsLoading,
    refetch: refetchTrends,
  } = useGetSalesTrendsQuery({
    ...dateRange,
    groupBy,
  });

  // Top licenses for earnings breakdown
  const {
    data: topLicenses,
    isLoading: topLicensesLoading,
    refetch: refetchTopLicenses,
  } = useGetTopSellingLicensesQuery({
    limit: 5,
    ...dateRange,
  });

  const isLoading = currentLoading || trendsLoading || topLicensesLoading;

  const handleRefresh = () => {
    refetchCurrent();
    refetchTrends();
    refetchTopLicenses();
  };

  // Calculate percentage change
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const revenueChange = useMemo(() => {
    if (!currentAnalytics || !previousAnalytics) return 0;
    return calculateChange(currentAnalytics.totalRevenue, previousAnalytics.totalRevenue);
  }, [currentAnalytics, previousAnalytics]);

  const ordersChange = useMemo(() => {
    if (!currentAnalytics || !previousAnalytics) return 0;
    return calculateChange(currentAnalytics.completedOrders, previousAnalytics.completedOrders);
  }, [currentAnalytics, previousAnalytics]);

  // Format chart data
  const chartData = useMemo(() => {
    if (!trends) return [];
    return trends.map((t) => ({
      date: t.date,
      revenue: t.revenue,
    }));
  }, [trends]);

  // Format pie chart data
  const pieData = useMemo(() => {
    if (!topLicenses) return [];
    return topLicenses.map((l) => ({
      name: l.licenseName,
      value: l.revenue,
    }));
  }, [topLicenses]);

  // Calculate total from top licenses
  const topLicensesTotal = useMemo(() => {
    return topLicenses?.reduce((sum, l) => sum + l.revenue, 0) || 0;
  }, [topLicenses]);

  const ChangeIndicator = ({ value }: { value: number }) => {
    if (value === 0) return <span className="text-muted-foreground">No change</span>;
    const isPositive = value > 0;
    return (
      <span className={`flex items-center gap-1 text-sm ${isPositive ? "text-green-600" : "text-red-600"}`}>
        {isPositive ? <IconArrowUp className="h-4 w-4" /> : <IconArrowDown className="h-4 w-4" />}
        {Math.abs(value).toFixed(1)}%
      </span>
    );
  };

  return (
    <DashboardLayout breadcrumbItems={breadcrumbItems}>
      <div className="flex flex-col gap-4 md:gap-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Earnings</h1>
            <p className="text-muted-foreground">
              Track your revenue and earnings performance
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

        {/* Overview Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Earnings */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <IconWallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {currentLoading ? (
                <Skeleton className="h-8 w-28" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {formatCurrency("USD", currentAnalytics?.totalRevenue || 0)}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <ChangeIndicator value={revenueChange} />
                    <span className="text-xs text-muted-foreground">vs previous period</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Pending Earnings */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <IconCalendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {currentLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-yellow-600">
                    {formatCurrency("USD", currentAnalytics?.pendingRevenue || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {currentAnalytics?.pendingOrders || 0} pending orders
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Completed Sales */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Sales</CardTitle>
              <IconReceipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {currentLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {currentAnalytics?.completedOrders || 0}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <ChangeIndicator value={ordersChange} />
                    <span className="text-xs text-muted-foreground">vs previous period</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Average Per Sale */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Per Sale</CardTitle>
              <IconTrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {currentLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {formatCurrency("USD", currentAnalytics?.averageOrderValue || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Per completed order
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>
              Your earnings over the selected period
            </CardDescription>
          </CardHeader>
          <CardContent>
            {trendsLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : chartData.length > 0 ? (
              <ChartContainer config={revenueChartConfig} className="h-[300px] w-full">
                <LineChart data={chartData}>
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
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => [`$${Number(value).toFixed(2)}`, "Revenue"]}
                      />
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--color-revenue)"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ChartContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                No revenue data available for this period
              </div>
            )}
          </CardContent>
        </Card>

        {/* Earnings Breakdown and Top Earners */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Earnings by License */}
          <Card>
            <CardHeader>
              <CardTitle>Earnings by License</CardTitle>
              <CardDescription>Revenue distribution across your top licenses</CardDescription>
            </CardHeader>
            <CardContent>
              {topLicensesLoading ? (
                <Skeleton className="h-[250px] w-full" />
              ) : pieData.length > 0 ? (
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name.slice(0, 10)}${name.length > 10 ? "..." : ""} (${(percent * 100).toFixed(0)}%)`
                        }
                        labelLine={false}
                      >
                        {pieData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-[250px] items-center justify-center text-muted-foreground">
                  No license earnings data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Earning Licenses */}
          <Card>
            <CardHeader>
              <CardTitle>Top Earning Licenses</CardTitle>
              <CardDescription>Your best performing licenses by revenue</CardDescription>
            </CardHeader>
            <CardContent>
              {topLicensesLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : topLicenses && topLicenses.length > 0 ? (
                <div className="space-y-4">
                  {topLicenses.map((license, index) => {
                    const percentage = topLicensesTotal > 0
                      ? (license.revenue / topLicensesTotal) * 100
                      : 0;

                    return (
                      <div key={license.licenseId} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                            />
                            <span className="font-medium text-sm truncate max-w-[150px]">
                              {license.licenseName}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-semibold">
                              {formatCurrency("USD", license.revenue)}
                            </span>
                            <span className="text-xs text-muted-foreground ml-2">
                              ({license.orderCount} sales)
                            </span>
                          </div>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                  No earnings data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage your sales and analytics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Link href="/dashboard/analytics">
                <Button variant="outline">
                  <IconTrendingUp className="h-4 w-4 mr-2" />
                  View Analytics
                </Button>
              </Link>
              <Link href="/dashboard/sales">
                <Button variant="outline">
                  <IconReceipt className="h-4 w-4 mr-2" />
                  View All Sales
                </Button>
              </Link>
              <Link href="/dashboard/licenses">
                <Button variant="outline">
                  <IconCurrencyDollar className="h-4 w-4 mr-2" />
                  Manage Licenses
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
