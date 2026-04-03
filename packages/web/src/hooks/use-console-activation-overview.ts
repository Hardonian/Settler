"use client";

import { useCallback, useEffect, useState } from "react";
import { safeFetch } from "@/lib/safe-fetch";
import type { ConsoleActivationOverview } from "@/lib/activation/overview";

interface ActivationOverviewResponse {
  data?: ConsoleActivationOverview;
  overview?: ConsoleActivationOverview;
}

export function useConsoleActivationOverview(options?: { refreshIntervalMs?: number }) {
  const refreshIntervalMs = options?.refreshIntervalMs ?? 0;
  const [data, setData] = useState<ConsoleActivationOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading((current) => (data ? current : true));
    const result = await safeFetch<ActivationOverviewResponse>("/api/console/activation");

    if (!result.success || !result.data) {
      setError(result.error?.message || "Failed to load activation overview");
      setLoading(false);
      return;
    }

    const overview = result.data.data ?? result.data.overview ?? null;
    setData(overview);
    setError(null);
    setLoading(false);
  }, [data]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!refreshIntervalMs) {
      return undefined;
    }

    const interval = setInterval(() => void load(), refreshIntervalMs);
    return () => clearInterval(interval);
  }, [load, refreshIntervalMs]);

  return {
    data,
    loading,
    error,
    refresh: load,
  };
}
