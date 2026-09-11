import React from "react";
import { Check, X, Minus, ShieldCheck, Zap, Cpu, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "@/components/site/primitives";

interface ComparisonRow {
  dimension: string;
  settler: string | boolean;
  blackline: string | boolean;
  modernTreasury: string | boolean;
  customScripts: string | boolean;
  highlight?: boolean;
}

const COMPARISON_DATA: ComparisonRow[] = [
  {
    dimension: "Time to First Live Match",
    settler: "< 10 minutes (CLI / SDK)",
    blackline: "3–6 months (consulting)",
    modernTreasury: "2–4 weeks (bank setup)",
    customScripts: "Months of custom coding",
    highlight: true,
  },
  {
    dimension: "Mathematical Determinism",
    settler: "Exact Int64 Cents (0% Float Drift)",
    blackline: "Best-effort DB heuristics",
    modernTreasury: "Event-based ledgering",
    customScripts: "IEEE-754 floating point errors",
    highlight: true,
  },
  {
    dimension: "Audit Evidence Rigor",
    settler: "RFC 6962 SHA-256 Merkle Proofpack",
    blackline: "Static PDF binders & CSV exports",
    modernTreasury: "Webhook event logs",
    customScripts: "Unverified raw database logs",
    highlight: true,
  },
  {
    dimension: "Close Cycle Speed",
    settler: "Continuous T+0 (< 5ms latency)",
    blackline: "Overnight batch / T+10 month-end",
    modernTreasury: "Near real-time bank polling",
    customScripts: "Scheduled cron jobs",
    highlight: true,
  },
  {
    dimension: "Processor Fee Leakage Clawback",
    settler: "Automated tier creep detection",
    blackline: "Manual spreadsheet reconciliation",
    modernTreasury: "None (payment rail focus)",
    customScripts: "None",
    highlight: true,
  },
  {
    dimension: "Turnkey Connectors",
    settler: "30+ verified (Stripe, SAP, NetSuite)",
    blackline: "Legacy ERP via custom ETL",
    modernTreasury: "Direct banking APIs",
    customScripts: "Manual bespoke integrations",
  },
  {
    dimension: "Replay & Verification Engine",
    settler: "Deterministic WASM browser verifier",
    blackline: "None (proprietary closed box)",
    modernTreasury: "None",
    customScripts: "None",
  },
  {
    dimension: "Pricing & Total Cost of Ownership",
    settler: "Open: Free OSS, $99 Pro, transparent",
    blackline: "$100K–$250K/yr + $50K consulting",
    modernTreasury: "$1K–$10K/mo platform fees",
    customScripts: "Unbounded ongoing dev maintenance",
    highlight: true,
  },
];

export function CompetitiveComparisonTable() {
  const renderCell = (val: string | boolean, isSettler = false) => {
    if (typeof val === "boolean") {
      return val ? (
        <Check className={`h-5 w-5 mx-auto ${isSettler ? "text-emerald-500" : "text-foreground"}`} />
      ) : (
        <X className="h-5 w-5 mx-auto text-muted-foreground/50" />
      );
    }
    return (
      <span
        className={`text-xs sm:text-sm font-medium ${
          isSettler
            ? "font-semibold text-primary dark:text-emerald-400"
            : "text-muted-foreground dark:text-muted-foreground/90"
        }`}
      >
        {val}
      </span>
    );
  };

  return (
    <div className="w-full">
      <div className="text-center max-w-3xl mx-auto mb-8">
        <Badge variant="outline" className="mb-3 border-primary/30 text-primary uppercase text-[10px] font-bold tracking-widest">
          Competitive Positioning
        </Badge>
        <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Settler vs. Legacy Alternatives
        </h3>
        <p className="mt-2 text-sm sm:text-base text-muted-foreground">
          Why high-growth tech companies and modern enterprises replace legacy batch monoliths and brittle in-house scripts with Settler&apos;s deterministic financial kernel.
        </p>
      </div>

      <Card className="overflow-hidden border-border/70 shadow-xl bg-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" role="table" aria-label="Competitive comparison matrix">
              <thead>
                <tr className="border-b border-border/80 bg-muted/40">
                  <th scope="col" className="p-4 sm:p-5 text-xs font-bold uppercase tracking-wider text-muted-foreground w-1/4">
                    Capability &amp; Metric
                  </th>
                  <th
                    scope="col"
                    className="p-4 sm:p-5 text-center w-1/4 bg-primary/10 dark:bg-primary/15 border-x border-primary/20"
                  >
                    <div className="inline-flex items-center gap-1.5 font-bold text-primary text-sm sm:text-base">
                      <Cpu className="h-4 w-4" />
                      Settler
                    </div>
                    <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      Deterministic Kernel
                    </div>
                  </th>
                  <th scope="col" className="p-4 sm:p-5 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground w-1/6">
                    <div>BlackLine</div>
                    <div className="text-[10px] text-muted-foreground/70 normal-case font-normal">(Nasdaq: BL)</div>
                  </th>
                  <th scope="col" className="p-4 sm:p-5 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground w-1/6">
                    <div>Modern Treasury</div>
                    <div className="text-[10px] text-muted-foreground/70 normal-case font-normal">(Bank Rails)</div>
                  </th>
                  <th scope="col" className="p-4 sm:p-5 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground w-1/6">
                    <div>In-House Scripts</div>
                    <div className="text-[10px] text-muted-foreground/70 normal-case font-normal">(Python / SQL)</div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {COMPARISON_DATA.map((row, idx) => (
                  <tr
                    key={row.dimension}
                    className={`transition-colors hover:bg-muted/20 ${
                      row.highlight ? "bg-muted/5" : ""
                    }`}
                  >
                    <td className="p-4 sm:p-5 font-medium text-foreground text-xs sm:text-sm">
                      {row.dimension}
                    </td>
                    <td className="p-4 sm:p-5 text-center bg-primary/5 dark:bg-primary/10 border-x border-primary/20">
                      {renderCell(row.settler, true)}
                    </td>
                    <td className="p-4 sm:p-5 text-center">
                      {renderCell(row.blackline)}
                    </td>
                    <td className="p-4 sm:p-5 text-center">
                      {renderCell(row.modernTreasury)}
                    </td>
                    <td className="p-4 sm:p-5 text-center">
                      {renderCell(row.customScripts)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
