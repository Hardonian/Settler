import Link from "next/link";
import RoleMatrix from "@/components/stitch-import/RoleMatrix";
import FreezeToggle from "@/components/stitch-import/FreezeToggle";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Governance</p>
        <h1 className="text-2xl font-semibold">Tenant Isolation Controls</h1>
        <p className="text-sm text-slate-600">
          Configure runtime controls and role boundaries used to preserve multi-tenant safety.
        </p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <FreezeToggle />
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <RoleMatrix />
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
        Tenant isolation verification artifacts are tracked under <code>security/evidence</code> and
        route-level controls are visible in the audit surfaces.
        <div className="mt-3 flex flex-wrap gap-4">
          <Link href="/app/audit" className="font-medium text-blue-600">
            Open Audit Surfaces →
          </Link>
          <Link href="/app/evidence" className="font-medium text-blue-600">
            Open Evidence Query Surface →
          </Link>
        </div>
      </div>
    </div>
  );
}
