import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import PolicyViewer from "@/components/stitch-import/PolicyViewer";

export default function PoliciesPage() {
  return (
    <>
      <Navigation />
      <main
        id="main-content"
        className="min-h-screen bg-background text-foreground pt-24 px-4 pb-12"
      >
        <div className="mx-auto max-w-6xl space-y-4">
          <h1 className="text-3xl font-bold text-foreground">Policy Explorer</h1>
          <p className="text-muted-foreground">
            Inspect enforced reconciliation policies and access constraints.
          </p>
          <div className="rounded-xl border border-border bg-card p-4">
            <PolicyViewer initialPolicies={[]} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
