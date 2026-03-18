import { headers } from "next/headers";
import ControlPlaneOverview from "@/components/ControlPlaneOverview";

async function getSystemHealth() {
  const h = await headers();
  const host = h.get("host") || "localhost:3000";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";

  try {
    const res = await fetch(`${protocol}://${host}/api/v1/system-health`, {
      headers: { authorization: h.get("authorization") || "" },
      cache: "no-store",
    });

    if (!res.ok) {
      return {
        error: `Failed to fetch system health (${res.status})`,
        health: null,
      };
    }

    const data = await res.json();
    return { health: data.data, error: null };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Network error",
      health: null,
    };
  }
}

export default async function SystemHealthPage() {
  const { health, error } = await getSystemHealth();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Observability
        </p>
        <h1 className="text-2xl font-semibold text-foreground">System Telemetry</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Control-plane health, runtime posture, and service dependency status. Surfaces are derived
          from live system checks and may reflect transient conditions.
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>
      )}

      <div className="rounded-xl border border-border bg-card p-4">
        <ControlPlaneOverview health={health} />
      </div>
    </div>
  );
}
