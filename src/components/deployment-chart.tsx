"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Bar, BarChart } from "recharts";

import { useIsMobile } from "@/hooks/use-mobile";
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    ToggleGroup,
    ToggleGroupItem,
} from "@/components/ui/toggle-group";
import { DeploymentTrend, StatsPeriod } from "@/common/types/statistics";
import { Skeleton } from "@/components/ui/skeleton";

interface DeploymentChartProps {
    trends: DeploymentTrend[] | null;
    loading: boolean;
    period: StatsPeriod;
    onPeriodChange: (period: StatsPeriod) => void;
}

const chartConfig = {
    successful: {
        label: "Successful",
        color: "hsl(var(--chart-1))",
    },
    failed: {
        label: "Failed",
        color: "hsl(var(--chart-2))",
    },
    count: {
        label: "Total",
        color: "hsl(var(--chart-3))",
    },
} satisfies ChartConfig;

function formatDate(dateString: string, period: StatsPeriod): string {
    // Handle different date formats based on period
    if (period === StatsPeriod.YEAR) {
        // Format: YYYY-MM
        const [year, month] = dateString.split("-");
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    }

    // Format: YYYY-MM-DD
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        return dateString;
    }

    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
    });
}

export function DeploymentChart({
    trends,
    loading,
    period,
    onPeriodChange,
}: DeploymentChartProps) {
    const isMobile = useIsMobile();
    const [chartType, setChartType] = React.useState<"area" | "bar">("area");

    const chartData = React.useMemo(() => {
        if (!trends || trends.length === 0) return [];

        return trends.map((trend) => ({
            date: trend.date,
            formattedDate: formatDate(trend.date, period),
            successful: trend.successful,
            failed: trend.failed,
            count: trend.count,
        }));
    }, [trends, period]);

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Deployment Analytics</CardTitle>
                    <CardDescription>Deployment activity over time</CardDescription>
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-[250px] w-full" />
                </CardContent>
            </Card>
        );
    }

    if (!trends || trends.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Deployment Analytics</CardTitle>
                    <CardDescription>No deployment data available</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-[250px] text-muted-foreground">
                    Start deploying to see your analytics
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="@container/chart">
            <CardHeader>
                <CardTitle>Deployment Analytics</CardTitle>
                <CardDescription>Deployment activity over time</CardDescription>
                <CardAction>
                    <div className="flex items-center gap-2">
                        <ToggleGroup
                            type="single"
                            value={chartType}
                            onValueChange={(value) => value && setChartType(value as "area" | "bar")}
                            className="hidden @[400px]/chart:flex"
                        >
                            <ToggleGroupItem value="area" className="h-8 px-2.5">
                                Area
                            </ToggleGroupItem>
                            <ToggleGroupItem value="bar" className="h-8 px-2.5">
                                Bar
                            </ToggleGroupItem>
                        </ToggleGroup>
                        <Select
                            value={period}
                            onValueChange={(value) => onPeriodChange(value as StatsPeriod)}
                        >
                            <SelectTrigger
                                className="h-8 w-[120px] rounded-lg"
                                aria-label="Select period"
                            >
                                <SelectValue placeholder="Select period" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                <SelectItem value={StatsPeriod.WEEK} className="rounded-lg">
                                    This Week
                                </SelectItem>
                                <SelectItem value={StatsPeriod.MONTH} className="rounded-lg">
                                    This Month
                                </SelectItem>
                                <SelectItem value={StatsPeriod.YEAR} className="rounded-lg">
                                    This Year
                                </SelectItem>
                                <SelectItem value={StatsPeriod.ALL_TIME} className="rounded-lg">
                                    All Time
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardAction>
            </CardHeader>
            <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                <ChartContainer
                    config={chartConfig}
                    className="aspect-auto h-[250px] w-full"
                >
                    {chartType === "area" ? (
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="fillSuccessful" x1="0" y1="0" x2="0" y2="1">
                                    <stop
                                        offset="5%"
                                        stopColor="var(--color-successful)"
                                        stopOpacity={0.8}
                                    />
                                    <stop
                                        offset="95%"
                                        stopColor="var(--color-successful)"
                                        stopOpacity={0.1}
                                    />
                                </linearGradient>
                                <linearGradient id="fillFailed" x1="0" y1="0" x2="0" y2="1">
                                    <stop
                                        offset="5%"
                                        stopColor="var(--color-failed)"
                                        stopOpacity={0.8}
                                    />
                                    <stop
                                        offset="95%"
                                        stopColor="var(--color-failed)"
                                        stopOpacity={0.1}
                                    />
                                </linearGradient>
                            </defs>
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey="formattedDate"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                minTickGap={32}
                            />
                            <ChartTooltip
                                cursor={false}
                                content={
                                    <ChartTooltipContent
                                        labelFormatter={(value) => value}
                                        indicator="dot"
                                    />
                                }
                            />
                            <Area
                                dataKey="failed"
                                type="natural"
                                fill="url(#fillFailed)"
                                stroke="var(--color-failed)"
                                stackId="a"
                            />
                            <Area
                                dataKey="successful"
                                type="natural"
                                fill="url(#fillSuccessful)"
                                stroke="var(--color-successful)"
                                stackId="a"
                            />
                        </AreaChart>
                    ) : (
                        <BarChart data={chartData}>
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey="formattedDate"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                minTickGap={32}
                            />
                            <YAxis
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                            />
                            <ChartTooltip
                                cursor={false}
                                content={
                                    <ChartTooltipContent
                                        labelFormatter={(value) => value}
                                        indicator="dot"
                                    />
                                }
                            />
                            <Bar
                                dataKey="successful"
                                fill="var(--color-successful)"
                                radius={[4, 4, 0, 0]}
                                stackId="a"
                            />
                            <Bar
                                dataKey="failed"
                                fill="var(--color-failed)"
                                radius={[4, 4, 0, 0]}
                                stackId="a"
                            />
                        </BarChart>
                    )}
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
