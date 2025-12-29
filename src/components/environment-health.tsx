"use client";

import { CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { EnvironmentStats } from "@/common/types/statistics";
import { Skeleton } from "@/components/ui/skeleton";

interface EnvironmentHealthProps {
    stats: EnvironmentStats[] | null;
    loading: boolean;
}

function getHealthStatus(successRate: number) {
    if (successRate >= 90) {
        return {
            label: "Healthy",
            icon: <CheckCircle2 size={14} />,
            className: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
        };
    }
    if (successRate >= 70) {
        return {
            label: "Warning",
            icon: <AlertCircle size={14} />,
            className: "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20",
        };
    }
    return {
        label: "Critical",
        icon: <XCircle size={14} />,
        className: "bg-red-500/10 text-red-500 hover:bg-red-500/20",
    };
}

function formatEnvironmentName(env: string): string {
    return env.charAt(0).toUpperCase() + env.slice(1).toLowerCase();
}

export function EnvironmentHealth({ stats, loading }: EnvironmentHealthProps) {
    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Deployment Health</CardTitle>
                    <CardDescription>Current status across environments</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-3 w-20" />
                                </div>
                                <Skeleton className="h-6 w-20" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!stats || stats.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Deployment Health</CardTitle>
                    <CardDescription>No deployment data available</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-[150px] text-muted-foreground">
                    Start deploying to see environment health
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Deployment Health</CardTitle>
                <CardDescription>Current status across environments</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {stats.map((env) => {
                        const health = getHealthStatus(env.successRate);
                        return (
                            <div key={env.environment} className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium leading-none">
                                        {formatEnvironmentName(env.environment)}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {env.count} deployments • {env.successRate.toFixed(0)}% success
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className={health.className}>
                                        {health.icon} {health.label}
                                    </Badge>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
