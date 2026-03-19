import { getPoliciesList } from "@/lib/domain/runs/runs-reader";
import PolicyViewer from "@/components/stitch-import/PolicyViewer";

export const metadata = {
  title: "Policy Posture | Settler",
  description: "Monitor contract versions, drift events, and compliance posture.",
};

export default async function PoliciesPage() {
  const policies = await getPoliciesList();

  return (
    <div className="space-y-8 pb-8">
      <div className="max-w-4xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary/70 mb-2">
          Governance & Compliance
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          Policy Posture
        </h1>
        <p className="mt-4 text-base text-muted-foreground leading-relaxed">
          Manage your reconciliation contracts and monitoring rules. 
          Policy Posture tracks versioning, active drift detections, 
          and ensures all data flows adhere to the workspace's trust rules.
        </p>
      </div>

      <div className="rounded-2xl border border-border/40 bg-card/50 p-6 sm:p-8">
        <PolicyViewer initialPolicies={policies} />
      </div>
    </div>
  );
}
