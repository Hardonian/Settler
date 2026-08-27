"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldAlert, LockKeyhole, FileDown } from "lucide-react";
import { toast } from "sonner";

export default function LockPeriodPage() {
  const [isLocking, setIsLocking] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  const handleLock = async () => {
    setIsLocking(true);
    try {
      const res = await fetch("/api/v1/governance/freeze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          frozen: true,
          reason: "Month-End SOC2 Close",
        }),
      });

      if (!res.ok) throw new Error("Failed to lock period");

      setIsLocked(true);
      toast.success("Ledger Locked", {
        description: "All transactions and records for this period are now immutable.",
      });
    } catch (err) {
      toast.error("Lock Failed", {
        description: err instanceof Error ? err.message : "An error occurred.",
      });
    } finally {
      setIsLocking(false);
    }
  };

  return (
    <div className="space-y-8 pb-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <ShieldAlert className="w-8 h-8 text-primary" />
          Month-End Ledger Lock
        </h1>
        <p className="mt-4 text-base text-muted-foreground leading-relaxed">
          Cryptographically seal your ledgers and reconciliations. Once locked, no mutations or
          adjustments can be made to the underlying transaction records. This provides
          auditor-guaranteed immutability for SOC1/SOC2 compliance.
        </p>
      </div>

      <div className="grid gap-6">
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <LockKeyhole className="w-5 h-5" />
              Initiate Financial Close
            </CardTitle>
            <CardDescription className="text-foreground/80">
              This action is permanent for the current financial period. All APIs will reject
              write/update operations until the next period opens.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLocked ? (
              <div className="p-4 rounded bg-primary/10 border border-primary/20 text-primary font-bold flex items-center justify-between">
                <span>System is currently FROZEN and immutable.</span>
                <Button variant="outline" className="gap-2">
                  <FileDown className="w-4 h-4" />
                  Export Auditor Artifacts
                </Button>
              </div>
            ) : (
              <Button
                variant="destructive"
                onClick={handleLock}
                disabled={isLocking}
                className="w-full sm:w-auto font-bold"
              >
                {isLocking ? "Sealing Ledgers..." : "Lock All Ledgers Now"}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
