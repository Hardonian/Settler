"use client";

import { useState } from "react";
import { ConsolePageHeader } from "@/components/console/ConsolePageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle2, AlertCircle, FileText, ArrowRight, Download } from "lucide-react";
import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion/variants";

export default function FinancialClosePage() {
  const [closeStatus, setCloseStatus] = useState<"open" | "ready" | "closed">("ready");

  const closeTasks = [
    { name: "Stripe ↔ Bank Reconciled", status: "complete", date: "Oct 31" },
    { name: "Shopify ↔ Bank Reconciled", status: "complete", date: "Oct 31" },
    { name: "Open Exceptions < Materiality Threshold", status: "complete", value: "$142.50 open" },
    { name: "Manual Adjustments Reviewed", status: "pending", value: "3 pending" },
  ];

  return (
    <div className="space-y-6">
      <ConsolePageHeader
        title="Financial Close"
        description="Period-end reconciliation summary, open items aging, and sign-off workflow."
        actions={
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Journal Entries
          </Button>
        }
      />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="grid gap-6 md:grid-cols-3"
      >
        {/* Readiness Score */}
        <Card className="md:col-span-1 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg">Close Readiness</CardTitle>
            <CardDescription>October 2026</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <div className="text-6xl font-bold text-primary mb-2">92%</div>
            <p className="text-sm text-muted-foreground text-center mb-6">
              Ready for accounting sign-off.
            </p>
            <Button
              className="w-full"
              variant={closeStatus === "closed" ? "outline" : "default"}
              onClick={async () => {
                if (closeStatus === "closed") {
                  setCloseStatus("ready");
                } else {
                  try {
                    const res = await fetch("/api/close/sign-off", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ period: "2026-10" }),
                    });
                    const data = await res.json();
                    if (data.data?.status === "closed") {
                      setCloseStatus("closed");
                      alert(
                        `Period successfully closed. Cryptographic Signature: ${data.data.signature}`
                      );
                    }
                  } catch (e) {
                    console.error(e);
                    alert("Failed to close period securely.");
                  }
                }
              }}
            >
              {closeStatus === "closed" ? "Reopen Period" : "Sign Off & Close Period"}
            </Button>
          </CardContent>
        </Card>

        {/* Close Checklist */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Close Checklist</CardTitle>
            <CardDescription>Automated verification of period-end tasks.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {closeTasks.map((task, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card/50"
                >
                  <div className="flex items-center gap-3">
                    {task.status === "complete" ? (
                      <CheckCircle2 className="w-5 h-5 text-success" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-amber-500" />
                    )}
                    <span className="font-medium text-sm">{task.name}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">{task.date || task.value}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Aging Summary */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle className="text-lg">Exception Aging (Not cleared by period end)</CardTitle>
            <CardDescription>
              Unresolved exceptions carrying over into the next period.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border border-border bg-card text-center">
                <div className="text-2xl font-bold">14</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
                  0-7 Days
                </div>
                <div className="text-sm font-medium mt-2 text-muted-foreground">$1,240.50</div>
              </div>
              <div className="p-4 rounded-xl border border-border bg-card text-center">
                <div className="text-2xl font-bold">3</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
                  8-30 Days
                </div>
                <div className="text-sm font-medium mt-2 text-muted-foreground">$450.00</div>
              </div>
              <div className="p-4 rounded-xl border border-border bg-card text-center">
                <div className="text-2xl font-bold">0</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
                  31-60 Days
                </div>
                <div className="text-sm font-medium mt-2 text-muted-foreground">$0.00</div>
              </div>
              <div className="p-4 rounded-xl border border-border bg-destructive/10 text-center">
                <div className="text-2xl font-bold text-destructive">1</div>
                <div className="text-xs text-destructive uppercase tracking-wider mt-1">
                  90+ Days
                </div>
                <div className="text-sm font-medium mt-2 text-destructive">$12.00</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
