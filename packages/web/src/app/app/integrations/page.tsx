import IntegrationList from "@/components/stitch-import/IntegrationList";
import Link from "next/link";

export default function IntegrationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Integrations</h1>
          <p className="text-sm text-slate-600 mt-1">
            Manage your active connectors and data source integrations.
          </p>
        </div>
        <Link
          href="/app/connections"
          className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          Add Integration
        </Link>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <IntegrationList />
      </div>
    </div>
  );
}
