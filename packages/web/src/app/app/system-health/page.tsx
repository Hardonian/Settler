import ControlPlaneOverview from "@/components/stitch-import/ControlPlaneOverview";

export default function SystemHealthPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Observability
        </p>
        <h1 className="text-2xl font-semibold">System Telemetry</h1>
        <p className="mt-1 text-sm text-slate-600">
          Control-plane health, runtime posture, and service dependency status. Surfaces are derived
          from live system checks and may reflect transient conditions.
        </p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <ControlPlaneOverview />
      </div>
    </div>
  );
}
