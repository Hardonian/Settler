import ControlPlaneOverview from "@/components/ControlPlaneOverview";
import { probeRuntimeConnectivityHealth } from "@/lib/status/runtime-connectivity-health";
import { PageHeader } from "@/components/app/PageHeader";
import { Activity } from "lucide-react";

async function getSystemHealth() {
  try {
    const connectivity = await probeRuntimeConnectivityHealth();

    const mapCheck = (check: { ok: boolean; status: "healthy" | "degraded"; reason?: string }) => ({
      status: check.status,
      error: check.reason,
      timestamp: connectivity.timestamp,
    });

    return {
      health: {
        status: connectivity.overall,
        checks: {
          database: mapCheck(connectivity.checks.database),
          supabase: mapCheck(connectivity.checks.supabase),
          runtime_env: mapCheck(connectivity.checks.runtime_env),
        },
        timestamp: connectivity.timestamp,
      },
      error: null,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to probe runtime connectivity",
      health: null,
    };
  }
}

export default async function SystemHealthPage() {
  const { health, error } = await getSystemHealth();

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        eyebrow="Observability"
        title="System Telemetry"
        description="Control-plane health, runtime posture, and service dependency status. Surfaces are derived from live system checks and reflect point-in-time connectivity."
        icon={Activity}
        variant="hero"
      />

      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>
      )}

      <div className="rounded-xl border border-border bg-card p-6">
        <ControlPlaneOverview health={health} />
      </div>
    </div>
  );
}
