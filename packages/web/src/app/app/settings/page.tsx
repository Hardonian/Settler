import Link from "next/link";
import RoleMatrix from "@/components/RoleMatrix";
import FreezeToggle from "@/components/FreezeToggle";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Governance
        </p>
        <h1 className="text-2xl font-semibold text-foreground">Tenant Isolation Controls</h1>
        <p className="text-sm text-muted-foreground">
          Configure runtime controls and role boundaries used to preserve multi-tenant safety.
        </p>
      </div>
      <div className="rounded-xl border border-border bg-card p-4">
        <FreezeToggle />
      </div>
      <div className="rounded-xl border border-border bg-card p-4">
        <RoleMatrix />
      </div>
      <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
        Tenant isolation verification artifacts are tracked under{" "}
        <code className="bg-muted px-1 rounded text-foreground">security/evidence</code> and
        route-level controls are visible in the audit surfaces.
        <div className="mt-3 flex flex-wrap gap-4">
          <Link href="/app/audit" className="font-medium text-primary hover:underline">
            Open Audit Surfaces →
          </Link>
          <Link href="/app/evidence" className="font-medium text-primary hover:underline">
            Open Evidence Query Surface →
          </Link>
        </div>
      </div>
    </div>
  );
}
