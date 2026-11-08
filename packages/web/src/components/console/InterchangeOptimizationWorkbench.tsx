"use client";

import React, { useState } from "react";
import { AlertTriangle, CheckCircle2, Copy, CreditCard, Sparkles, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface SingleForensicState {
  cardBrand: "VISA" | "MASTERCARD" | "AMEX";
  cardCategory:
    "CREDIT_COMMERCIAL_B2B" | "CREDIT_CONSUMER" | "DEBIT_REGULATED" | "CREDIT_PREMIUM_REWARDS";
  amountUsd: number;
  actualFeeUsd: number;
  captureHours: number;
  hasL3LineItems: boolean;
  hasSalesTax: boolean;
}

export function InterchangeOptimizationWorkbench() {
  const [activeTab, setActiveTab] = useState<"single" | "portfolio" | "enrichment">("single");
  const [copiedPayload, setCopiedPayload] = useState(false);

  // Single transaction forensic state
  const [forensic, setForensic] = useState<SingleForensicState>({
    cardBrand: "VISA",
    cardCategory: "CREDIT_COMMERCIAL_B2B",
    amountUsd: 2500,
    actualFeeUsd: 73.75, // 2.95% ($73.75)
    captureHours: 14,
    hasL3LineItems: false,
    hasSalesTax: false,
  });

  // Calculate forensics on the fly
  const amountCents = Math.round(forensic.amountUsd * 100);
  const actualFeeCents = Math.round(forensic.actualFeeUsd * 100);
  const effectiveBps = amountCents > 0 ? Math.round((actualFeeCents / amountCents) * 10000) : 0;

  // Target rates based on scheme rules
  let targetBps = 151;
  let targetFixedCents = 10;
  let downgradeReason: string | null = null;
  let remediation = "Transaction qualified at optimal card scheme interchange.";

  if (forensic.cardCategory === "DEBIT_REGULATED") {
    targetBps = 5;
    targetFixedCents = 22;
    if (effectiveBps > 50) {
      downgradeReason = "DOWNGRADE_DURBIN_OVERCHARGE";
      remediation =
        "Statutory Durbin cap (0.05% + 22¢) exceeded. Acquirer fee schedule requires adjustment.";
    }
  } else if (forensic.cardCategory === "CREDIT_COMMERCIAL_B2B") {
    targetBps = forensic.cardBrand === "MASTERCARD" ? 175 : 180;
    targetFixedCents = 10;
    if (!forensic.hasL3LineItems) {
      downgradeReason = "DOWNGRADE_MISSING_LEVEL_3";
      remediation =
        "Corporate card missing Level 3 line items. Synthesize itemized invoice and tax to recover 85-115 bps.";
    }
  } else if (forensic.captureHours > 48) {
    targetBps = 186;
    downgradeReason = "DOWNGRADE_EIRF_TIMING_BREACH";
    remediation = `Capture delayed by ${forensic.captureHours}h (>48h SLA). Settle within 24h to eliminate ~35 bps EIRF penalty.`;
  }

  // Network assessments (14 bps Visa / 13 bps MC + ~2c fixed)
  const networkAssessmentBps = forensic.cardBrand === "MASTERCARD" ? 13 : 14;
  const networkAssessmentCents = Math.round((amountCents * networkAssessmentBps) / 10000) + 2;
  const markupCents = Math.round((amountCents * 10) / 10000) + 5;
  const optimalInterchangeCents = Math.round((amountCents * targetBps) / 10000) + targetFixedCents;
  const optimalTotalFeeCents = optimalInterchangeCents + networkAssessmentCents + markupCents;

  const recoverableLeakageCents = Math.max(0, actualFeeCents - optimalTotalFeeCents);
  const recoverableLeakageUsd = recoverableLeakageCents / 100;
  const bpsLeaked = Math.max(
    0,
    effectiveBps - Math.round((optimalTotalFeeCents / amountCents) * 10000)
  );

  // Synthesized Level 3 Payload
  const synthesizedPayload = {
    transaction_id: "tx_comm_synth_904",
    amount_cents: amountCents,
    currency: "USD",
    level_3_data: {
      customer_reference: "PO-2026-CORPORATE-09",
      sales_tax_amount_cents: Math.round(amountCents * 0.0825), // 8.25% sales tax
      tax_exempt_indicator: false,
      summary_commodity_code: "43211500", // UNSPSC: Computer servers & software
      line_items: [
        {
          product_code: "SETTLER-PRO-ANNUAL",
          item_description: "Settler Enterprise Ledger Subscription",
          quantity: 1,
          unit_price_cents: amountCents,
          commodity_code: "43211500",
          tax_amount_cents: Math.round(amountCents * 0.0825),
        },
      ],
    },
    routing_directive: "DISPATCH_TO_ACQUIRER_L3_CLEARED",
  };

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(JSON.stringify(synthesizedPayload, null, 2));
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  return (
    <Card className="border-border/60 bg-card/60 backdrop-blur">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="text-emerald-500 border-emerald-500/30 font-mono text-[10px]"
              >
                FORENSIC INTERCHANGE++
              </Badge>
              <Badge variant="secondary" className="font-mono text-[10px]">
                LEVEL 2 / 3 OPTIMIZER
              </Badge>
            </div>
            <CardTitle className="text-lg font-semibold tracking-tight text-foreground mt-1">
              Card Scheme Fee Deconstruction & Downgrade Recovery
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Audits card scheme interchange, network assessments (Visa FANF / Mastercard NABU), and
              recovers 65–115 bps from B2B Level 3 downgrades.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={activeTab === "single" ? "default" : "outline"}
              className="text-xs h-8"
              onClick={() => setActiveTab("single")}
            >
              <CreditCard className="w-3.5 h-3.5 mr-1.5" />
              Single Transaction
            </Button>
            <Button
              size="sm"
              variant={activeTab === "portfolio" ? "default" : "outline"}
              className="text-xs h-8"
              onClick={() => setActiveTab("portfolio")}
            >
              <TrendingUp className="w-3.5 h-3.5 mr-1.5" />
              Portfolio Leakage
            </Button>
            <Button
              size="sm"
              variant={activeTab === "enrichment" ? "default" : "outline"}
              className="text-xs h-8"
              onClick={() => setActiveTab("enrichment")}
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              L3 Synthesizer
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Metric Summary Ribbon */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-lg border border-border/50 bg-background/50">
            <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
              Effective Fee Paid
            </div>
            <div className="text-xl font-bold font-mono text-foreground mt-1">
              {effectiveBps} <span className="text-xs font-normal text-muted-foreground">bps</span>
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              ${forensic.actualFeeUsd.toFixed(2)} on ${forensic.amountUsd.toFixed(2)}
            </div>
          </div>

          <div className="p-3.5 rounded-lg border border-border/50 bg-background/50">
            <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
              Optimal Target Rate
            </div>
            <div className="text-xl font-bold font-mono text-emerald-500 mt-1">
              {Math.round((optimalTotalFeeCents / amountCents) * 10000)}{" "}
              <span className="text-xs font-normal text-muted-foreground">bps</span>
            </div>
            <div className="text-[10px] text-emerald-500/80 mt-0.5">
              Level 3 / Qualified tier benchmark
            </div>
          </div>

          <div className="p-3.5 rounded-lg border border-border/50 bg-background/50">
            <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
              Recoverable Slippage
            </div>
            <div
              className={`text-xl font-bold font-mono mt-1 ${recoverableLeakageUsd > 0 ? "text-amber-500" : "text-emerald-500"}`}
            >
              +${recoverableLeakageUsd.toFixed(2)}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              {bpsLeaked} bps excess margin leaked
            </div>
          </div>

          <div className="p-3.5 rounded-lg border border-border/50 bg-background/50">
            <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
              Annualized Run-Rate Value
            </div>
            <div className="text-xl font-bold font-mono text-blue-500 mt-1">
              +$
              {(recoverableLeakageUsd * 12000).toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}
            </div>
            <div className="text-[10px] text-blue-500/80 mt-0.5">Across enterprise B2B volume</div>
          </div>
        </div>

        {/* Tab 1: Single Transaction Forensics */}
        {activeTab === "single" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Form Controls */}
              <div className="space-y-3 p-4 rounded-lg border border-border/40 bg-muted/20">
                <div className="text-xs font-semibold text-foreground uppercase tracking-wider font-mono">
                  Transaction Parameters
                </div>

                <div>
                  <label className="text-[11px] text-muted-foreground block mb-1">Card Brand</label>
                  <select
                    className="w-full text-xs bg-background border border-border rounded px-2.5 py-1.5 font-mono"
                    value={forensic.cardBrand}
                    onChange={(e) => setForensic({ ...forensic, cardBrand: e.target.value as any })}
                  >
                    <option value="VISA">Visa</option>
                    <option value="MASTERCARD">Mastercard</option>
                    <option value="AMEX">American Express</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-muted-foreground block mb-1">
                    Card Category
                  </label>
                  <select
                    className="w-full text-xs bg-background border border-border rounded px-2.5 py-1.5 font-mono"
                    value={forensic.cardCategory}
                    onChange={(e) =>
                      setForensic({ ...forensic, cardCategory: e.target.value as any })
                    }
                  >
                    <option value="CREDIT_COMMERCIAL_B2B">Corporate Card (B2B Commercial)</option>
                    <option value="CREDIT_CONSUMER">Consumer Credit (Standard)</option>
                    <option value="DEBIT_REGULATED">Durbin Regulated Debit</option>
                    <option value="CREDIT_PREMIUM_REWARDS">Premium Rewards / Infinite</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-muted-foreground block mb-1">
                      Gross Amount ($)
                    </label>
                    <input
                      type="number"
                      className="w-full text-xs bg-background border border-border rounded px-2.5 py-1.5 font-mono"
                      value={forensic.amountUsd}
                      onChange={(e) =>
                        setForensic({ ...forensic, amountUsd: Math.max(1, Number(e.target.value)) })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground block mb-1">
                      Actual Fee ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full text-xs bg-background border border-border rounded px-2.5 py-1.5 font-mono"
                      value={forensic.actualFeeUsd}
                      onChange={(e) =>
                        setForensic({
                          ...forensic,
                          actualFeeUsd: Math.max(0.01, Number(e.target.value)),
                        })
                      }
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-muted-foreground">
                    Level 3 Line Items Included?
                  </span>
                  <input
                    type="checkbox"
                    className="rounded border-border"
                    checked={forensic.hasL3LineItems}
                    onChange={(e) => setForensic({ ...forensic, hasL3LineItems: e.target.checked })}
                  />
                </div>
              </div>

              {/* Fee Decomposition */}
              <div className="md:col-span-2 space-y-3 p-4 rounded-lg border border-border/40 bg-muted/20">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-foreground uppercase tracking-wider font-mono">
                    Interchange++ Decomposition
                  </div>
                  {downgradeReason ? (
                    <Badge variant="destructive" className="text-[10px] font-mono">
                      {downgradeReason}
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-emerald-500 border-emerald-500/30 text-[10px] font-mono"
                    >
                      OPTIMAL INTERCHANGE
                    </Badge>
                  )}
                </div>

                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-xs py-1 border-b border-border/30">
                    <span className="text-muted-foreground">1. Base Card Scheme Interchange</span>
                    <span className="font-mono text-foreground">
                      ${(optimalInterchangeCents / 100).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs py-1 border-b border-border/30">
                    <span className="text-muted-foreground">
                      2. Network Assessments (Visa FANF / MC NABU)
                    </span>
                    <span className="font-mono text-foreground">
                      ${(networkAssessmentCents / 100).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs py-1 border-b border-border/30">
                    <span className="text-muted-foreground">
                      3. Standard Acquirer / Gateway Markup
                    </span>
                    <span className="font-mono text-foreground">
                      ${(markupCents / 100).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs py-1 font-semibold text-amber-500">
                    <span>4. Downgrade Penalty Slippage</span>
                    <span className="font-mono">+${recoverableLeakageUsd.toFixed(2)}</span>
                  </div>
                </div>

                <div className="p-3 rounded bg-background/80 border border-border/50 text-xs">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-foreground">Remediation Protocol:</div>
                      <div className="text-muted-foreground text-[11px] mt-0.5">{remediation}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Portfolio Leakage */}
        {activeTab === "portfolio" && (
          <div className="space-y-3">
            <div className="overflow-x-auto rounded-lg border border-border/50">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/40 border-b border-border/50 text-muted-foreground text-[11px] font-mono uppercase text-left">
                    <th className="p-2.5">Downgrade Reason</th>
                    <th className="p-2.5">Transactions</th>
                    <th className="p-2.5">Gross Volume</th>
                    <th className="p-2.5">Penalty Bps</th>
                    <th className="p-2.5">Recoverable Leakage</th>
                    <th className="p-2.5">Action Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30 font-mono">
                  <tr className="hover:bg-muted/20">
                    <td className="p-2.5 font-semibold text-amber-400">
                      DOWNGRADE_MISSING_LEVEL_3
                    </td>
                    <td className="p-2.5">4,120 txns</td>
                    <td className="p-2.5">$10,300,000</td>
                    <td className="p-2.5 text-amber-400">+115 bps</td>
                    <td className="p-2.5 font-bold text-emerald-400">+$118,450</td>
                    <td className="p-2.5">
                      <Badge
                        variant="outline"
                        className="text-emerald-400 border-emerald-500/30 text-[10px]"
                      >
                        SYNTHESIZER READY
                      </Badge>
                    </td>
                  </tr>
                  <tr className="hover:bg-muted/20">
                    <td className="p-2.5 font-semibold text-amber-400">
                      DOWNGRADE_EIRF_TIMING_BREACH
                    </td>
                    <td className="p-2.5">1,480 txns</td>
                    <td className="p-2.5">$3,700,000</td>
                    <td className="p-2.5 text-amber-400">+35 bps</td>
                    <td className="p-2.5 font-bold text-emerald-400">+$12,950</td>
                    <td className="p-2.5">
                      <Badge
                        variant="outline"
                        className="text-blue-400 border-blue-500/30 text-[10px]"
                      >
                        24H SLA ENFORCED
                      </Badge>
                    </td>
                  </tr>
                  <tr className="hover:bg-muted/20">
                    <td className="p-2.5 font-semibold text-red-400">
                      DOWNGRADE_DURBIN_OVERCHARGE
                    </td>
                    <td className="p-2.5">850 txns</td>
                    <td className="p-2.5">$1,275,000</td>
                    <td className="p-2.5 text-red-400">+48 bps</td>
                    <td className="p-2.5 font-bold text-emerald-400">+$6,120</td>
                    <td className="p-2.5">
                      <Badge
                        variant="outline"
                        className="text-purple-400 border-purple-500/30 text-[10px]"
                      >
                        CLAIM FILED
                      </Badge>
                    </td>
                  </tr>
                  <tr className="bg-muted/10 font-bold">
                    <td className="p-2.5">TOTAL FORENSIC RECOVERY</td>
                    <td className="p-2.5">6,450 txns</td>
                    <td className="p-2.5">$15,275,000</td>
                    <td className="p-2.5 text-emerald-400">+90 bps avg</td>
                    <td className="p-2.5 text-emerald-400">+$137,520</td>
                    <td className="p-2.5 text-muted-foreground">ANNUALIZED</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: L3 Synthesizer */}
        {activeTab === "enrichment" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                Synthesized B2B payload ready to submit with Stripe / Adyen / Braintree captures:
              </div>
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-7 gap-1"
                onClick={handleCopyPayload}
              >
                {copiedPayload ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                {copiedPayload ? "Copied JSON" : "Copy Payload"}
              </Button>
            </div>

            <pre className="p-4 rounded-lg bg-black/60 border border-border/50 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-60">
              {JSON.stringify(synthesizedPayload, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
export default InterchangeOptimizationWorkbench;
