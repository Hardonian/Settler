import PolicyViewer from "@/components/stitch-import/PolicyViewer";

export default function PoliciesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Policies</h1>
        <p className="text-sm text-muted-foreground">
          Review live policy posture and access enforcement.
        </p>
      </div>
      <div className="rounded-xl border border-border bg-card p-4">
        <PolicyViewer />
      </div>
    </div>
  );
}
