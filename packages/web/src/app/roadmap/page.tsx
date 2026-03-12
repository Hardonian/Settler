import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { AnimatedPageWrapper } from "@/components/AnimatedPageWrapper";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RealityEvidencePanel } from "@/components/RealityEvidencePanel";

const roadmap = {
  shipped: [
    "Node.js SDK package",
    "Trust and transparency routes",
    "Receipts and reconciliation product routes",
    "Proof explorer and architecture surfaces",
  ],
  inProgress: [
    "Expanded operator workflows in /app/*",
    "SDK parity improvements across Java and C# packages",
    "Enterprise control-plane polish",
  ],
  directional: [
    "Managed cloud deployment hardening",
    "Additional adapter packs and workflow templates",
    "Deeper anomaly and remediation guidance",
  ],
};

export default function RoadmapPage() {
  return (
    <AnimatedPageWrapper aria-label="Roadmap page">
      <Navigation />
      <section className="px-4 pt-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Breadcrumbs items={[{ label: "Roadmap" }]} />
        </div>

        <div className="mx-auto max-w-7xl">
          <RealityEvidencePanel scope="roadmap" title="Roadmap provenance references" />
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-4xl text-center">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
            Roadmap and direction (explicitly labeled)
          </h1>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
            This view separates shipped capabilities from in-progress work and directional themes.
            Directional items are not represented as currently shipped functionality.
          </p>
        </div>

        <div className="mx-auto mb-8 grid max-w-7xl gap-6 md:grid-cols-3">
          <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/30 dark:bg-emerald-900/10">
            <CardHeader>
              <Badge className="w-fit bg-emerald-600 hover:bg-emerald-700">Shipped</Badge>
              <CardTitle>Current-state proof</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {roadmap.shipped.map((item) => (
                  <li key={item} className="flex gap-2 text-sm">
                    <span className="mt-2 h-2 w-2 rounded-full bg-emerald-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900/30 dark:bg-blue-900/10">
            <CardHeader>
              <Badge className="w-fit bg-blue-600 hover:bg-blue-700">In progress</Badge>
              <CardTitle>Execution underway</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {roadmap.inProgress.map((item) => (
                  <li key={item} className="flex gap-2 text-sm">
                    <span className="mt-2 h-2 w-2 rounded-full bg-blue-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/10">
            <CardHeader>
              <Badge variant="outline" className="w-fit">
                Directional
              </Badge>
              <CardTitle>Planned / future direction</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {roadmap.directional.map((item) => (
                  <li key={item} className="flex gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <span className="mt-2 h-2 w-2 rounded-full bg-slate-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </AnimatedPageWrapper>
  );
}
