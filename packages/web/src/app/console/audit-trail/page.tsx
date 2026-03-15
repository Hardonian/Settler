import { ConsolePageHeader } from "@/components/console/ConsolePageHeader";
import { AdvancedAuditTrail } from "@/components/console/AdvancedAuditTrail";

export default function AuditTrailPage() {
  return (
    <div className="space-y-6">
      <ConsolePageHeader
        title="Audit Trail"
        description="Tenant-scoped audit logs for operational actions, policy events, and evidence exports."
      />
      <AdvancedAuditTrail />
    </div>
  );
}
