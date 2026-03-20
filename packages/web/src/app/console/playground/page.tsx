import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import {
  Play,
  Code,
  Terminal as TerminalIcon,
  Database,
  History,
  ShieldCheck,
  Zap,
  Maximize2,
  Settings,
  RefreshCw,
  FlaskConical,
} from "lucide-react";

export const metadata = {
  title: "Reconciliation Playground | Settler",
  description:
    "Test your reconciliation policies against staging data using the deterministic Settler engine.",
};

export default function PlaygroundPage() {
  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-end justify-between">
        <div className="max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary/70 mb-2">
            Policy Development
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Reconciliation Playground
          </h1>
          <p className="mt-4 text-base text-muted-foreground leading-relaxed">
            The playground provides a safe, isolated sandbox for testing your reconciliation logic.
            Execute policies against synthetic or staged data and inspect the resulting Merkle
            proofs before deploying to production.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" className="h-10 font-bold gap-2">
            <History className="h-4 w-4 text-muted-foreground" />
            Load Recent
          </Button>
          <Button variant="outline" size="sm" className="h-10 font-bold gap-2">
            <Settings className="h-4 w-4 text-muted-foreground" />
            Environment Config
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Editor Sidebar / Selectors */}
        <div className="space-y-6">
          <Card className="border-border/40 bg-card/50 shadow-none">
            <CardHeader className="pb-4 border-b border-border/20">
              <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                <FlaskConical className="h-3.5 w-3.5" />
                Test Input Sources
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <p
                  id="primary-adapter-label"
                  className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-wider"
                >
                  Primary Adapter
                </p>
                <select
                  title="Primary Adapter"
                  aria-labelledby="primary-adapter-label"
                  className="w-full h-10 px-3 rounded-lg bg-muted/40 border-none text-xs font-bold focus:ring-1 focus:ring-primary appearance-none outline-none"
                >
                  <option>Stripe Production (Live)</option>
                  <option>Synthetic Payment Cluster</option>
                  <option>Adyen Mirror V2</option>
                </select>
              </div>
              <div className="space-y-2">
                <p
                  id="secondary-adapter-label"
                  className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-wider"
                >
                  Secondary Adapter
                </p>
                <select
                  title="Secondary Adapter"
                  aria-labelledby="secondary-adapter-label"
                  className="w-full h-10 px-3 rounded-lg bg-muted/40 border-none text-xs font-bold focus:ring-1 focus:ring-primary appearance-none outline-none"
                >
                  <option>PostgreSQL Internal (Trust)</option>
                  <option>Shopify Mirror (Staging)</option>
                </select>
              </div>
              <div className="pt-4 space-y-3">
                <p className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-wider">
                  Active Policy
                </p>
                <div className="flex items-center gap-2 p-3 rounded-lg border border-primary/20 bg-primary/5 text-primary text-xs font-bold">
                  <ShieldCheck className="h-4 w-4" />
                  Standard_Reconciliation_v2
                </div>
              </div>
            </CardContent>
          </Card>

          <section className="p-6 rounded-2xl bg-muted/20 border border-border/40 text-center space-y-4">
            <Zap className="h-8 w-8 text-primary opacity-40 mx-auto" />
            <h4 className="text-xs font-bold tracking-tight italic">Resource Guard Active</h4>
            <p className="text-[9px] text-muted-foreground leading-relaxed italic uppercase font-medium">
              Playground runs are limited to 1,000 records per execution to maintain dev-loop speed.
            </p>
          </section>
        </div>

        {/* Main Editor / Execution Shell */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="border-border/40 shadow-2xl overflow-hidden glass border-l-4 border-l-primary/60 min-h-[600px] flex flex-col">
            <CardHeader className="bg-muted/10 pb-4 border-b border-border/40 relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5 h-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/40" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/40" />
                  </div>
                  <div className="ml-4 h-6 px-3 rounded bg-slate-800 text-[10px] font-mono text-slate-400 flex items-center gap-2">
                    <Code size={10} />
                    Standard_Reconciliation_v2.ts
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                    <Maximize2 size={14} />
                  </Button>
                  <Button size="sm" className="h-8 font-bold gap-2 px-4 shadow-xl">
                    <Play className="h-3 w-3 fill-current" />
                    Trigger Local Run
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-6 font-mono text-sm leading-relaxed overflow-hidden bg-slate-950 text-slate-300">
              <div className="space-y-1 opacity-90">
                <p>
                  <span className="text-slate-500">01</span>{" "}
                  <span className="text-primary-foreground/40 italic">
                    // Configure matching invariant for payment reconciliation
                  </span>
                </p>
                <p>
                  <span className="text-slate-500">02</span>{" "}
                  <span className="text-indigo-400">export default</span> {`{`}
                </p>
                <p>
                  <span className="text-slate-500">03</span>{" "}
                  <span className="text-teal-400">identifier:</span>{" "}
                  <span className="text-amber-200">&quot;STD_RECO_V2&quot;</span>,
                </p>
                <p>
                  <span className="text-slate-500">04</span>{" "}
                  <span className="text-teal-400">match:</span> (
                  <span className="text-indigo-400">source, target</span>){" "}
                  <span className="text-indigo-400">=&gt;</span> {`{`}
                </p>
                <p>
                  <span className="text-slate-500">05</span>{" "}
                  <span className="text-indigo-400">return</span> source.transaction_hash ===
                  target.metadata.hash_v1;
                </p>
                <p>
                  <span className="text-slate-500">06</span> {`}`},
                </p>
                <p>
                  <span className="text-slate-500">07</span>{" "}
                  <span className="text-teal-400">invariants:</span> [
                </p>
                <p>
                  <span className="text-slate-500">08</span> {`{`}{" "}
                  <span className="text-teal-400">key:</span>{" "}
                  <span className="text-amber-200">&quot;currency_match&quot;</span>,{" "}
                  <span className="text-teal-400">strict:</span>{" "}
                  <span className="text-indigo-400">true</span> {`},`}
                </p>
                <p>
                  <span className="text-slate-500">09</span> {`{`}{" "}
                  <span className="text-teal-400">key:</span>{" "}
                  <span className="text-amber-200">&quot;amount_parity&quot;</span>,{" "}
                  <span className="text-teal-400">threshold:</span>{" "}
                  <span className="text-amber-200">0.01</span> {`}`}{" "}
                </p>
                <p>
                  <span className="text-slate-500">10</span> ]
                </p>
                <p>
                  <span className="text-slate-500">11</span> {`}`}
                </p>
                <p className="mt-8 text-slate-500"># Waiting for execution command...</p>
              </div>
            </CardContent>
            <div className="bg-slate-900 border-t border-white/5 p-4 overflow-hidden">
              <div className="flex items-center gap-4">
                <TerminalIcon size={16} className="text-primary opacity-60" />
                <div className="flex gap-4">
                  <div className="flex items-center gap-1.5 opacity-60">
                    <div className="h-2 w-2 rounded-full bg-success" />
                    <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">
                      Static Analysis: Passed
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 opacity-60">
                    <div className="h-2 w-2 rounded-full bg-success" />
                    <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">
                      Determinism Check: Ready
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-border/40 bg-card/40">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="h-10 w-10 flex-shrink-0 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <RefreshCw className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold">Fast Reload</h3>
                  <p className="text-[10px] text-muted-foreground font-medium italic underline">
                    Instantly apply policy changes to the local execution context.
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/40 bg-card/40">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="h-10 w-10 flex-shrink-0 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <Database className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold">Mock Generators</h3>
                  <p className="text-[10px] text-muted-foreground font-medium italic underline">
                    Generate synthetic data clusters based on schema definitions.
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/40 bg-card/40">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="h-10 w-10 flex-shrink-0 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold">Proof Peek</h3>
                  <p className="text-[10px] text-muted-foreground font-medium italic underline">
                    Visualize the Merkle tree intermediate state during matches.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
