import IntegrationList from "@/components/stitch-import/IntegrationList";
import Link from "next/link";

export default function IntegrationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Operator Intelligence
          </p>
          <h1 className="text-2xl font-semibold text-foreground">Integrations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage active connectors and data source integrations.
          </p>
        </div>
        <Link
          href="/docs/integrations"
          className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Add Integration
        </Link>
      </div>
      <div className="rounded-xl border border-border bg-card p-4">
        <IntegrationList />
      </div>
    </div>
  );
}
