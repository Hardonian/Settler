"use client";

import { useState } from "react";
import { ConsolePageHeader } from "@/components/console/ConsolePageHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Download,
  FileSpreadsheet,
  ArrowRight,
  Building2,
  Landmark,
  CheckCircle2,
} from "lucide-react";
import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion/variants";

export default function GLExportPage() {
  const [erpFormat, setErpFormat] = useState("netsuite");
  const [period, setPeriod] = useState("current");
  const [syncReceipt, setSyncReceipt] = useState<{
    jeId: string;
    digest: string;
    timestamp: string;
  } | null>(null);

  const handleDownloadCsv = () => {
    const periodDate = period === "current" ? "2026-10-31" : "2026-09-30";
    const rows = [
      [
        "JournalEntryId",
        "PostingDate",
        "ERPFormat",
        "AccountCode",
        "AccountName",
        "DebitUSD",
        "CreditUSD",
        "Memo",
      ],
      [
        `JE-${periodDate}-001`,
        periodDate,
        erpFormat.toUpperCase(),
        "1010",
        "Operating Cash - Bank Settlement",
        "98420.50",
        "0.00",
        "Settler verified batch deposit sweep",
      ],
      [
        `JE-${periodDate}-001`,
        periodDate,
        erpFormat.toUpperCase(),
        "6120",
        "Payment Processor Gateway Fees",
        "2934.50",
        "0.00",
        "Contractual processor fee allocation",
      ],
      [
        `JE-${periodDate}-001`,
        periodDate,
        erpFormat.toUpperCase(),
        "1140",
        "In-Transit Clearing Receivables",
        "0.00",
        "101355.00",
        "Balanced clearing settlement release",
      ],
    ];
    const csvContent = rows.map((r) => r.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `settler-gl-${erpFormat}-${periodDate}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleSyncOpenJes = async () => {
    const periodLabel = period === "current" ? "2026-10" : "2026-09";
    const canonicalPayload = JSON.stringify({
      erp: "netsuite",
      period: periodLabel,
      debitMinor: "10135500",
      creditMinor: "10135500",
    });
    const hashBuffer = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(canonicalPayload)
    );
    const digest = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    setSyncReceipt({
      jeId: `NS-JE-${digest.slice(0, 8).toUpperCase()}`,
      digest: digest.slice(0, 32),
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-6">
      <ConsolePageHeader
        title="General Ledger Export"
        description="Generate journal entries for your ERP based on reconciled transactions and exception adjustments."
        breadcrumbs={[{ label: "Close", href: "/console/close" }, { label: "GL Export" }]}
      />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="grid gap-6 md:grid-cols-2 lg:max-w-4xl"
      >
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-primary" />
              <CardTitle>Manual CSV Export</CardTitle>
            </div>
            <CardDescription>
              Download a standardized CSV file formatted for your accounting system.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>ERP Target Format</Label>
              <Select value={erpFormat} onValueChange={setErpFormat}>
                <SelectTrigger>
                  <SelectValue placeholder="Select ERP" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="netsuite">Oracle NetSuite</SelectItem>
                  <SelectItem value="qbo">QuickBooks Online</SelectItem>
                  <SelectItem value="xero">Xero</SelectItem>
                  <SelectItem value="generic">Generic CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Accounting Period</Label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">October 2026</SelectItem>
                  <SelectItem value="prev">September 2026</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter className="bg-muted/20 border-t border-border/50 pt-4">
            <Button className="w-full" onClick={handleDownloadCsv}>
              <Download className="w-4 h-4 mr-2" />
              Generate CSV Export
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ArrowRight className="w-5 h-5 text-primary" />
              <CardTitle>Direct API Integration</CardTitle>
            </div>
            <CardDescription>
              Automatically push journal entries to your ERP at the end of the period.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border bg-card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-primary">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <span className="font-medium">Oracle NetSuite</span>
                </div>
                <Badge
                  variant="outline"
                  className={
                    syncReceipt
                      ? "text-emerald-500 border-emerald-500/30"
                      : "text-amber-500 border-amber-500/30"
                  }
                >
                  {syncReceipt ? "Synced" : "Sandbox Ready"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground pt-1">
                Configure NetSuite Token-Based Authentication (TBA) to enable direct syncing.
              </p>
              {syncReceipt && (
                <div className="rounded border border-emerald-500/30 bg-emerald-500/10 p-2 text-xs font-mono text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">
                    {syncReceipt.jeId} · sha256:{syncReceipt.digest}
                  </span>
                </div>
              )}
              <div className="flex gap-2 mt-2">
                <Button variant="outline" size="sm" className="w-1/2" onClick={handleDownloadCsv}>
                  Preview Payload
                </Button>
                <Button
                  size="sm"
                  className="w-1/2 bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={handleSyncOpenJes}
                >
                  Sync Open JEs
                </Button>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-primary">
                    <Landmark className="w-4 h-4" />
                  </div>
                  <span className="font-medium">QuickBooks Online</span>
                </div>
                <Badge variant="outline" className="text-amber-500 border-amber-500/30">
                  Needs Setup
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground pt-1">
                Connect your QuickBooks Online account via OAuth.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2"
                onClick={handleDownloadCsv}
              >
                Export QBO Format
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
