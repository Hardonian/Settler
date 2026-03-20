import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Replay Lab - Docs",
  description:
    "Replay a historical run, verify evidence hashes, and export deterministic proof bundles.",
};

const steps = [
  {
    title: "Run a reconciliation and keep evidence",
    description:
      "Replay Lab depends on evidence.json from a completed run. The demo workflow generates this automatically.",
    code: `pnpm demo
ls examples/demo-output/
# run.json  results.json  evidence.json  report.html`,
  },
  {
    title: "Replay the run deterministically",
    description:
      "The replay command reconstructs execution and confirms that the output hash still matches.",
    code: `pnpm settler:replay examples/demo-output/evidence.json

# Expected signal:
# ✓ Replay complete — hash match confirmed`,
  },
  {
    title: "Review and share the evidence artifact",
    description:
      "Use the evidence file for audit packages, operator review, and deterministic incident analysis.",
    code: `cat examples/demo-output/evidence.json`,
  },
];

export default function ReplayLabDocsPage() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <h1>Replay Lab</h1>
      <p className="text-lg text-muted-foreground">
        Replay Lab is the verification surface for deterministic execution. It proves that a prior
        reconciliation can be replayed with identical output using the saved evidence artifact.
      </p>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 my-6">
        <p className="text-sm text-blue-800 dark:text-blue-200 m-0">
          <strong>Verification contract:</strong> replay is only considered successful when hash
          outputs match. A completed run without a matching replay should be treated as a drift
          signal, not success.
        </p>
      </div>

      <div className="space-y-6 my-6">
        {steps.map((step, index) => (
          <Card key={step.title} className="border-2">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-muted/40 flex items-center justify-center text-muted-foreground font-bold text-sm">
                  {index + 1}
                </div>
                <CardTitle className="text-lg">{step.title}</CardTitle>
              </div>
              <CardDescription>{step.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <CodeBlock code={step.code} language="bash" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 my-8">
        <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          Related surfaces
        </h2>
        <ul className="space-y-2 text-muted-foreground">
          <li>
            •{" "}
            <Link href="/replay-lab" className="text-blue-600 dark:text-blue-400 hover:underline">
              Replay Lab product page
            </Link>
          </li>
          <li>
            •{" "}
            <Link
              href="/docs/quickstart"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Quickstart guide
            </Link>
          </li>
          <li>
            •{" "}
            <Link
              href="/proof-explorer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Proof Explorer
            </Link>
          </li>
        </ul>
      </div>

      <Button asChild>
        <Link href="/replay-lab" className="inline-flex items-center gap-2">
          Open Replay Lab
          <ArrowRight className="w-4 h-4" />
        </Link>
      </Button>
    </div>
  );
}
