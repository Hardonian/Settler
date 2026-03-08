import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import ArchitectureOverview from "@/components/stitch-import/ArchitectureOverview";

export default function ProductPage() {
  return (
    <>
      <Navigation />
      <main id="main-content" className="min-h-screen bg-slate-50 pt-24">
        <section className="mx-auto max-w-6xl px-4 pb-8">
          <h1 className="text-4xl font-bold text-slate-900">Product Architecture</h1>
          <p className="mt-3 text-slate-600">
            The stitched control-plane architecture is now the primary product surface.
          </p>
        </section>
        <ArchitectureOverview />
      </main>
      <Footer />
    </>
  );
}
