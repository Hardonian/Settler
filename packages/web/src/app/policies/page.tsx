import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import PolicyViewer from "@/components/stitch-import/PolicyViewer";

export default function PoliciesPage() {
  return (
    <>
      <Navigation />
      <main id="main-content" className="min-h-screen bg-slate-50 pt-24 px-4 pb-12">
        <div className="mx-auto max-w-6xl space-y-4">
          <h1 className="text-3xl font-bold text-slate-900">Policy Explorer</h1>
          <p className="text-slate-600">
            Inspect enforced reconciliation policies and access constraints.
          </p>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <PolicyViewer />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
