import IntegrationList from "@/components/stitch-import/IntegrationList";
import Link from "next/link";

export default function IntegrationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Operator Intelligence
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">Integrations</h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage active connectors and data source integrations.
          </p>
        </div>
        <Link
          href="/docs/integrations"
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
