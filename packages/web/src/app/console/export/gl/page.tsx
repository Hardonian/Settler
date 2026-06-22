"use client";

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
import { Download, FileSpreadsheet, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion/variants";

export default function GLExportPage() {
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
              <Select defaultValue="netsuite">
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
              <Select defaultValue="current">
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
            <Button className="w-full">
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
                  <img
                    src="https://logo.clearbit.com/netsuite.com"
                    alt="NetSuite"
                    className="w-6 h-6 rounded"
                  />
                  <span className="font-medium">Oracle NetSuite</span>
                </div>
                <Badge variant="outline" className="text-amber-500 border-amber-500/30">
                  Needs Setup
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground pt-1">
                Configure NetSuite Token-Based Authentication (TBA) to enable direct syncing.
              </p>
              <Button variant="outline" size="sm" className="w-full mt-2">
                Configure NetSuite
              </Button>
            </div>

            <div className="rounded-lg border border-border bg-card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img
                    src="https://logo.clearbit.com/quickbooks.intuit.com"
                    alt="QBO"
                    className="w-6 h-6 rounded"
                  />
                  <span className="font-medium">QuickBooks Online</span>
                </div>
                <Badge variant="outline" className="text-amber-500 border-amber-500/30">
                  Needs Setup
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground pt-1">
                Connect your QuickBooks Online account via OAuth.
              </p>
              <Button variant="outline" size="sm" className="w-full mt-2">
                Connect QBO
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
