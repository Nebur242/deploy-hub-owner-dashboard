"use client";

import { useState } from "react";
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
import { RefreshCw } from "lucide-react";

import { StatsPeriod } from "@/common/types/statistics";
import { useDashboardStats, useEnvironmentStats } from "@/hooks/use-statistics";
import { StatisticsCards } from "@/components/statistics-cards";
import { DeploymentChart } from "@/components/deployment-chart";
import { EnvironmentHealth } from "@/components/environment-health";
import { RecentActivityTable } from "@/components/recent-activity-table";

export default function DashboardPage() {
  const [period, setPeriod] = useState<StatsPeriod>(StatsPeriod.MONTH);

  const {
    data: dashboardStats,
    loading: dashboardLoading,
    refetch: refetchDashboard,
  } = useDashboardStats({ period });

  const {
    data: environmentStats,
    loading: envLoading,
    refetch: refetchEnv,
  } = useEnvironmentStats({ period });

  const handleRefresh = () => {
    refetchDashboard();
    refetchEnv();
  };

  const handlePeriodChange = (newPeriod: StatsPeriod) => {
    setPeriod(newPeriod);
  };

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {/* Header with period selector and refresh button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your deployment statistics and activity
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={(v) => handlePeriodChange(v as StatsPeriod)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={StatsPeriod.TODAY}>Today</SelectItem>
              <SelectItem value={StatsPeriod.WEEK}>This Week</SelectItem>
              <SelectItem value={StatsPeriod.MONTH}>This Month</SelectItem>
              <SelectItem value={StatsPeriod.YEAR}>This Year</SelectItem>
              <SelectItem value={StatsPeriod.ALL_TIME}>All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={dashboardLoading || envLoading}
          >
            <RefreshCw
              className={`h-4 w-4 ${dashboardLoading || envLoading ? "animate-spin" : ""
                }`}
            />
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <StatisticsCards
        stats={dashboardStats}
        loading={dashboardLoading}
        period={period}
      />

      {/* Charts and Health Section */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="col-span-1 lg:col-span-2">
          <DeploymentChart
            trends={dashboardStats?.deploymentTrends || null}
            loading={dashboardLoading}
            period={period}
            onPeriodChange={handlePeriodChange}
          />
        </div>
        <div className="col-span-1">
          <EnvironmentHealth stats={environmentStats} loading={envLoading} />
        </div>
      </div>

      {/* Recent Activity Table */}
      <RecentActivityTable
        recentActivity={dashboardStats?.recentActivity || null}
        topProjects={dashboardStats?.projects?.topProjects || null}
        loading={dashboardLoading}
      />
    </div>
  );
}
