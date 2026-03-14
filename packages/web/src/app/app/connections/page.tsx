"use client";

import ConnectionsTable from "@/components/stitch-import/ConnectionsTable";
import ConnectionDrawer from "@/components/stitch-import/ConnectionDrawer";
import Link from "next/link";

export default function ConnectionsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Connections</h1>
          <p className="text-sm text-slate-600 mt-1">
            Manage data source connections and monitor integration health.
          </p>
        </div>
        <Link
          href="/app/integrations"
          className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          Add Connection
        </Link>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <ConnectionsTable />
      </div>
      <ConnectionDrawer />
    </div>
  );
}
