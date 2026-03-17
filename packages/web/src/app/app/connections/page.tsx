"use client";

import ConnectionsTable from "@/components/stitch-import/ConnectionsTable";
import ConnectionDrawer from "@/components/stitch-import/ConnectionDrawer";
import Link from "next/link";

export default function ConnectionsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Connections</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage data source connections and monitor integration health.
          </p>
        </div>
        <Link
          href="/app/integrations"
          className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Add Connection
        </Link>
      </div>
      <div className="rounded-xl border border-border bg-card p-4">
        <ConnectionsTable />
      </div>
      <ConnectionDrawer />
    </div>
  );
}
