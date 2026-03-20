import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { AnimatedHero } from "@/components/AnimatedHero";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  History,
  Play,
  ShieldCheck,
  Zap,
  ArrowRight,
  Terminal,
  RefreshCw,
  Layers,
} from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Replay Lab | Settler",
  description: "Deterministic execution replay infrastructure for financial auditing.",
};

const features = [
  {
    title: "100% Determinism",
    description:
      "Re-run any historical matching job with the exact data snapshot, ensuring 1:1 hash parity.",
    icon: RefreshCw,
  },
  {
    title: "Drift Visualization",
    description:
      "Compare baseline snapshots against production state to identify subtle data mutation.",
    icon: Layers,
  },
  {
    title: "Immutable Evidence",
    description:
      "Every replay is cryptographically signed and added to the audit-ready evidence chain.",
    icon: ShieldCheck,
  },
];

export default function ReplayLabMarketingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <AnimatedHero
        badge="Platform Feature"
        title="Replay Lab"
        description="Point-in-time reconstruction for financial flows. Every reconciliation run is a time-capsule, ready for replay, audit, and verification."
      />

      {/* Main Feature Visualization */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto -mt-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <h2 className="text-4xl font-bold tracking-tight italic">Audit-Ready Replay Engine</h2>
            <p className="text-lg text-muted-foreground font-medium leading-relaxed max-w-xl">
              Financial auditing requires more than just logs. Settler Replay Lab allows you to
              travel back to the exact moment of a match, restoring the full execution context to
              prove mathematical correctness at any later date.
            </p>

            <div className="space-y-4">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="flex gap-4 p-4 rounded-xl border border-border/40 bg-card/50"
                >
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">{f.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1 font-medium">
                      {f.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <Button asChild size="lg" className="h-14 px-8 text-lg font-bold group">
              <Link href="/signup">
                Start Replaying
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>

          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity" />
            <Card className="relative border-border/60 bg-slate-950 overflow-hidden min-h-[500px] flex flex-col">
              <div className="flex items-center gap-2 p-4 bg-slate-900 border-b border-white/5">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/20" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/20" />
                </div>
                <div className="ml-4 px-3 py-1 rounded bg-slate-800 text-[10px] font-mono text-slate-400">
                  ~/replay-engine/active-session
                </div>
              </div>
              <CardContent className="flex-1 p-6 font-mono text-sm leading-relaxed overflow-hidden">
                <div className="space-y-4">
                  <p className="text-slate-500"># Initializing Replay Session [ID: rpl_9281X]</p>
                  <p className="text-primary">$ setter restore --snapshot 2026-03-15T12:00:00Z</p>
                  <p className="text-slate-300 ml-4">
                    [SYSTEM] Restoring 4.2GB Ingestion Buffer...
                  </p>
                  <p className="text-slate-300 ml-4">
                    [SYSTEM] Applying Contract Policy: v2.4.1 (Hash: 8aF9...)
                  </p>
                  <p className="text-primary">$ settler execute --mode deterministic</p>
                  <div className="ml-4 space-y-1">
                    <p className="text-slate-400 flex items-center gap-2">
                      <Play className="h-3 w-3 fill-current text-primary" />
                      Replaying 152,491 matches...
                    </p>
                    <div className="h-1.5 w-full max-w-[200px] bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-primary w-[75%] animate-pulse" />
                    </div>
                  </div>
                  <p className="text-success font-bold mt-4">
                    DONE: 100% Match Hash Parity Confirmed.
                  </p>
                  <p className="text-slate-500">Proof Capsule generated: evidence_0315.json</p>
                </div>
              </CardContent>
              <div className="p-4 border-t border-white/5 bg-slate-900/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-primary">
                    <ShieldCheck className="h-4 w-4" />
                    <span className="text-[10px] uppercase font-bold tracking-widest">
                      Signed Evidence Ready
                    </span>
                  </div>
                  <Terminal className="h-4 w-4 text-slate-600" />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center space-y-12">
        <h2 className="text-3xl font-bold tracking-tight italic italic underline underline-offset-8">
          How it works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          {[
            {
              step: "01",
              title: "Ingestion Snapshot",
              desc: "Settler captures and hashes all raw ingestion data before processing.",
            },
            {
              step: "02",
              title: "Frozen Policy",
              desc: "The exact logic used during reconciliation is versioned and stored with the run.",
            },
            {
              step: "03",
              title: "Point-in-time Replay",
              desc: "Our engine reconstructs the VM state to prove the result is invariant.",
            },
          ].map((item) => (
            <div key={item.step} className="space-y-4">
              <span className="text-4xl font-black text-primary/20 italic">{item.step}</span>
              <h3 className="text-lg font-bold">{item.title}</h3>
              <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Pre-footer CTA */}
      <section className="py-24 bg-primary/5 border-t border-border/40">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <History className="h-16 w-16 text-primary mx-auto mb-8 opacity-40" />
          <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight italic">
            Stop Assuming. Start Proving.
          </h2>
          <p className="text-xl text-muted-foreground mb-10 leading-relaxed font-medium">
            Give your compliance and audit teams the tools they need to verify every financial
            outcome.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="h-14 px-8 text-lg font-bold">
              <Link href="/signup">Get Started</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-14 px-8 text-lg font-bold">
              <Link href="/docs/replay-lab">Read the Spec</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
