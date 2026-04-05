"use client";

import { useCallback, useEffect, useState } from "react";
import type { OperatorSurfaceCustomization } from "@/lib/operator-customization/schema";
import { defaultAdminDashboardCustomization } from "@/lib/operator-customization/registry";

export type CustomizationApiResponse = {
  surface: string;
  draft: OperatorSurfaceCustomization;
  published: OperatorSurfaceCustomization;
  publishedAt: string | null;
  draftUpdatedAt: string;
  degraded?: { inference: string; message: string };
};

export function useOperatorDashboardCustomization() {
  const [data, setData] = useState<CustomizationApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/operator-customization", { credentials: "include" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(typeof body.message === "string" ? body.message : `HTTP ${res.status}`);
        setData(null);
        return;
      }
      const json = (await res.json()) as CustomizationApiResponse;
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "load_failed");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return {
    data,
    error,
    loading,
    refetch,
    fallbackLayout: defaultAdminDashboardCustomization(),
  };
}

export function recordModuleViewSignal(moduleId: string): void {
  try {
    void fetch("/api/admin/operator-customization/signals", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ signalType: "module_view", moduleId }),
    });
  } catch {
    /* non-blocking */
  }
}
