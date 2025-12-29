"use client";

import { useState } from "react";
import {
    Clock,
    CheckCircle2,
    XCircle,
    Loader2,
} from "lucide-react";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RecentActivity, ProjectStats } from "@/common/types/statistics";

interface RecentActivityTableProps {
    recentActivity: RecentActivity[] | null;
    topProjects: ProjectStats["topProjects"] | null;
    loading: boolean;
}

function formatDate(dateString: string | Date | undefined | null): string {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date";
    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function getStatusBadge(status: string | undefined | null) {
    const statusLower = (status || 'unknown').toLowerCase();
    switch (statusLower) {
        case "success":
            return (
                <Badge
                    variant="outline"
                    className="bg-green-500/10 text-green-500 hover:bg-green-500/20"
                >
                    <CheckCircle2 size={14} className="mr-1" /> Success
                </Badge>
            );
        case "failed":
            return (
                <Badge variant="destructive" className="flex items-center gap-1">
                    <XCircle size={14} /> Failed
                </Badge>
            );
        case "running":
        case "in-progress":
        case "pending":
            return (
                <Badge variant="outline" className="flex items-center gap-1">
                    <Loader2 size={14} className="animate-spin" /> {status}
                </Badge>
            );
        case "canceled":
            return (
                <Badge variant="secondary" className="flex items-center gap-1">
                    <Clock size={14} /> Canceled
                </Badge>
            );
        default:
            return <Badge variant="secondary">{status}</Badge>;
    }
}

function TableSkeleton() {
    return (
        <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-[100px]" />
                    <Skeleton className="h-4 w-[120px]" />
                    <Skeleton className="h-4 w-[80px]" />
                </div>
            ))}
        </div>
    );
}

export function RecentActivityTable({
    recentActivity,
    topProjects,
    loading,
}: RecentActivityTableProps) {
    const [activeTab, setActiveTab] = useState("deployments");

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle>Project Activity</CardTitle>
            </CardHeader>
            <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">
                                View recent activities and projects
                            </p>
                        </div>
                        <TabsList>
                            <TabsTrigger value="deployments">Recent Deployments</TabsTrigger>
                            <TabsTrigger value="projects">Top Projects</TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="deployments" className="mt-4 p-0">
                        {loading ? (
                            <TableSkeleton />
                        ) : !recentActivity || recentActivity.length === 0 ? (
                            <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                                No recent deployments
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Project</TableHead>
                                        <TableHead>Environment</TableHead>
                                        <TableHead>Deployed At</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recentActivity.map((activity) => (
                                        <TableRow key={activity.id}>
                                            <TableCell className="font-medium">
                                                {activity.projectName || (activity.project_id ? `Project ${activity.project_id.slice(0, 8)}` : 'Unknown Project')}
                                            </TableCell>
                                            <TableCell className="capitalize">
                                                {activity.environment}
                                            </TableCell>
                                            <TableCell>{formatDate(activity.created_at)}</TableCell>
                                            <TableCell>{getStatusBadge(activity.status)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </TabsContent>

                    <TabsContent value="projects" className="mt-4 p-0">
                        {loading ? (
                            <TableSkeleton />
                        ) : !topProjects || topProjects.length === 0 ? (
                            <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                                No project data available
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Project Name</TableHead>
                                        <TableHead>Deployments</TableHead>
                                        <TableHead>Successful</TableHead>
                                        <TableHead>Success Rate</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {topProjects.map((project, index) => {
                                        const deploymentCount = project.deploymentCount ?? 0;
                                        const successCount = project.successCount ?? 0;
                                        const successRate =
                                            deploymentCount > 0
                                                ? (successCount / deploymentCount) * 100
                                                : 0;
                                        const projectKey = project.projectId || `project-${index}`;
                                        return (
                                            <TableRow key={projectKey}>
                                                <TableCell className="font-medium">
                                                    {project.projectName || (project.projectId ? `Project ${project.projectId.slice(0, 8)}` : 'Unknown Project')}
                                                </TableCell>
                                                <TableCell>{deploymentCount}</TableCell>
                                                <TableCell>{successCount}</TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant="outline"
                                                        className={
                                                            successRate >= 90
                                                                ? "bg-green-500/10 text-green-500"
                                                                : successRate >= 70
                                                                    ? "bg-yellow-500/10 text-yellow-500"
                                                                    : "bg-red-500/10 text-red-500"
                                                        }
                                                    >
                                                        {successRate.toFixed(0)}%
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        )}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
