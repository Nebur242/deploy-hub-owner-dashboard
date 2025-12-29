"use client";

import { useState, useEffect, useCallback } from "react";
import { statisticsService } from "@/services/statistics";
import {
  DashboardStats,
  DeploymentStats,
  DeploymentTrend,
  EnvironmentStats,
  LicenseStats,
  ProjectStats,
  StatsPeriod,
} from "@/common/types/statistics";

interface UseStatisticsOptions {
  period?: StatsPeriod;
  autoFetch?: boolean;
}

interface UseStatisticsReturn<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook for fetching dashboard statistics
 */
export function useDashboardStats(
  options: UseStatisticsOptions = {}
): UseStatisticsReturn<DashboardStats> {
  const { period = StatsPeriod.MONTH, autoFetch = true } = options;
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const stats = await statisticsService.getDashboardStats(period);
      setData(stats);
    } catch (err) {
      setError(
        err instanceof Error
          ? err
          : new Error("Failed to fetch dashboard stats")
      );
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [autoFetch, fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Hook for fetching deployment statistics
 */
export function useDeploymentStats(
  options: UseStatisticsOptions = {}
): UseStatisticsReturn<DeploymentStats> {
  const { period = StatsPeriod.MONTH, autoFetch = true } = options;
  const [data, setData] = useState<DeploymentStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const stats = await statisticsService.getDeploymentStats(period);
      setData(stats);
    } catch (err) {
      setError(
        err instanceof Error
          ? err
          : new Error("Failed to fetch deployment stats")
      );
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [autoFetch, fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Hook for fetching deployment trends
 */
export function useDeploymentTrends(
  options: UseStatisticsOptions = {}
): UseStatisticsReturn<DeploymentTrend[]> {
  const { period = StatsPeriod.MONTH, autoFetch = true } = options;
  const [data, setData] = useState<DeploymentTrend[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const trends = await statisticsService.getDeploymentTrends(period);
      setData(trends);
    } catch (err) {
      setError(
        err instanceof Error
          ? err
          : new Error("Failed to fetch deployment trends")
      );
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [autoFetch, fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Hook for fetching environment statistics
 */
export function useEnvironmentStats(
  options: UseStatisticsOptions = {}
): UseStatisticsReturn<EnvironmentStats[]> {
  const { period = StatsPeriod.MONTH, autoFetch = true } = options;
  const [data, setData] = useState<EnvironmentStats[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const stats = await statisticsService.getEnvironmentStats(period);
      setData(stats);
    } catch (err) {
      setError(
        err instanceof Error
          ? err
          : new Error("Failed to fetch environment stats")
      );
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [autoFetch, fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Hook for fetching project statistics
 */
export function useProjectStats(
  options: UseStatisticsOptions = {}
): UseStatisticsReturn<ProjectStats> {
  const { period = StatsPeriod.MONTH, autoFetch = true } = options;
  const [data, setData] = useState<ProjectStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const stats = await statisticsService.getProjectStats(period);
      setData(stats);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to fetch project stats")
      );
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [autoFetch, fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Hook for fetching license statistics
 */
export function useLicenseStats(
  options: UseStatisticsOptions = {}
): UseStatisticsReturn<LicenseStats> {
  const { period = StatsPeriod.MONTH, autoFetch = true } = options;
  const [data, setData] = useState<LicenseStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const stats = await statisticsService.getLicenseStats(period);
      setData(stats);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to fetch license stats")
      );
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [autoFetch, fetchData]);

  return { data, loading, error, refetch: fetchData };
}
