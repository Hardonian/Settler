import PolicyViewer from "@/components/stitch-import/PolicyViewer";

export default function PoliciesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Policies</h1>
        <p className="text-sm text-slate-600">Review live policy posture and access enforcement.</p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <PolicyViewer />
      </div>
    </div>
  );
}
