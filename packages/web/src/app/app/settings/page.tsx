import RoleMatrix from "@/components/stitch-import/RoleMatrix";
import FreezeToggle from "@/components/stitch-import/FreezeToggle";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings & Governance</h1>
        <p className="text-sm text-slate-600">Configure runtime controls and role boundaries.</p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <FreezeToggle />
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <RoleMatrix />
      </div>
    </div>
  );
}
