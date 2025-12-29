"use client";

import {
    ArrowUpRight,
    ArrowDownRight,
    Rocket,
    Server,
    DollarSign,
    Clock,
    Loader2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardAction,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { DashboardStats, StatsPeriod } from "@/common/types/statistics";
import { Skeleton } from "@/components/ui/skeleton";

interface StatisticsCardsProps {
    stats: DashboardStats | null;
    loading: boolean;
    period: StatsPeriod;
}

function formatDuration(seconds: number | undefined | null): string {
    if (seconds === undefined || seconds === null || isNaN(seconds)) return "0s";
    if (seconds < 60) {
        return `${Math.round(seconds)}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
}

function formatCurrency(amount: number | undefined | null): string {
    const value = amount ?? 0;
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(isNaN(value) ? 0 : value);
}

function formatNumber(num: number | undefined | null): string {
    const value = num ?? 0;
    return new Intl.NumberFormat("en-US").format(isNaN(value) ? 0 : value);
}

function safeNumber(num: number | undefined | null, fallback = 0): number {
    if (num === undefined || num === null || isNaN(num)) return fallback;
    return num;
}

function StatCardSkeleton() {
    return (
        <Card className="@container/card">
            <CardHeader>
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16 mt-2" />
                <CardAction>
                    <Skeleton className="h-5 w-16" />
                </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-32" />
            </CardFooter>
        </Card>
    );
}

export function StatisticsCards({ stats, loading, period }: StatisticsCardsProps) {
    if (loading) {
        return (
            <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
                <Card className="@container/card col-span-full">
                    <CardHeader>
                        <CardDescription>No statistics available</CardDescription>
                        <CardTitle className="text-lg">
                            Start deploying to see your statistics
                        </CardTitle>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    const { deployments, projects, licenses } = stats;
    const periodLabel = getPeriodLabel(period);

    // Safe access to nested values
    const successRate = safeNumber(deployments?.successRate);
    const totalDeployments = safeNumber(deployments?.total);
    const successfulDeployments = safeNumber(deployments?.successful);
    const failedDeployments = safeNumber(deployments?.failed);
    const runningDeployments = safeNumber(deployments?.running);
    const avgDuration = safeNumber(deployments?.avgDurationSeconds);

    const totalProjects = safeNumber(projects?.total);
    const activeProjects = safeNumber(projects?.activeWithDeployments);

    const totalRevenue = safeNumber(licenses?.totalRevenue);
    const totalSold = safeNumber(licenses?.totalSold);
    const activeLicenses = safeNumber(licenses?.activeLicenses);

    return (
        <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
            {/* Total Deployments Card */}
            <Card className="@container/card">
                <CardHeader>
                    <CardDescription>Total Deployments</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                        {formatNumber(totalDeployments)}
                    </CardTitle>
                    <CardAction>
                        <Badge variant="outline" className="flex gap-1 items-center">
                            {successRate >= 90 ? (
                                <ArrowUpRight className="h-3.5 w-3.5 text-green-500" />
                            ) : (
                                <ArrowDownRight className="h-3.5 w-3.5 text-destructive" />
                            )}
                            {successRate.toFixed(1)}%
                        </Badge>
                    </CardAction>
                </CardHeader>
                <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="line-clamp-1 flex gap-2 font-medium">
                        <Rocket className="size-4" /> {successfulDeployments} successful
                    </div>
                    <div className="text-muted-foreground">
                        {failedDeployments} failed {periodLabel}
                    </div>
                </CardFooter>
            </Card>

            {/* Active Projects Card */}
            <Card className="@container/card">
                <CardHeader>
                    <CardDescription>Active Projects</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                        {formatNumber(activeProjects)}
                    </CardTitle>
                    <CardAction>
                        <Badge variant="outline" className="flex gap-1 items-center">
                            <Server className="h-3.5 w-3.5" />
                            {totalProjects} total
                        </Badge>
                    </CardAction>
                </CardHeader>
                <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="line-clamp-1 flex gap-2 font-medium">
                        <Server className="size-4" /> Projects with deployments
                    </div>
                    <div className="text-muted-foreground">
                        {projects?.topProjects?.length || 0} top performing
                    </div>
                </CardFooter>
            </Card>

            {/* License Revenue Card */}
            <Card className="@container/card">
                <CardHeader>
                    <CardDescription>License Revenue</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                        {formatCurrency(totalRevenue)}
                    </CardTitle>
                    <CardAction>
                        <Badge variant="outline" className="flex gap-1 items-center">
                            <ArrowUpRight className="h-3.5 w-3.5 text-green-500" />
                            {totalSold} sold
                        </Badge>
                    </CardAction>
                </CardHeader>
                <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="line-clamp-1 flex gap-2 font-medium">
                        <DollarSign className="size-4" /> {activeLicenses} active
                    </div>
                    <div className="text-muted-foreground">
                        Across {licenses?.byProject?.length || 0} projects
                    </div>
                </CardFooter>
            </Card>

            {/* Success Rate Card */}
            <Card className="@container/card">
                <CardHeader>
                    <CardDescription>Success Rate</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                        {successRate.toFixed(1)}%
                    </CardTitle>
                    <CardAction>
                        <Badge
                            variant="outline"
                            className={`flex gap-1 items-center ${successRate >= 90
                                ? "text-green-500"
                                : successRate >= 70
                                    ? "text-yellow-500"
                                    : "text-destructive"
                                }`}
                        >
                            {successRate >= 90 ? (
                                <ArrowUpRight className="h-3.5 w-3.5" />
                            ) : (
                                <ArrowDownRight className="h-3.5 w-3.5" />
                            )}
                            {successRate >= 90 ? "Good" : "Needs attention"}
                        </Badge>
                    </CardAction>
                </CardHeader>
                <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="line-clamp-1 flex gap-2 font-medium">
                        <Clock className="size-4" /> Avg: {formatDuration(avgDuration)}
                    </div>
                    <div className="text-muted-foreground">
                        {runningDeployments} currently running
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}

function getPeriodLabel(period: StatsPeriod): string {
    switch (period) {
        case StatsPeriod.TODAY:
            return "today";
        case StatsPeriod.WEEK:
            return "this week";
        case StatsPeriod.MONTH:
            return "this month";
        case StatsPeriod.YEAR:
            return "this year";
        case StatsPeriod.ALL_TIME:
            return "all time";
        default:
            return "";
    }
}
