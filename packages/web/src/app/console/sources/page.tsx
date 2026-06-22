"use client";

import { ConsolePageHeader } from "@/components/console/ConsolePageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ServerCrash, Database, CheckCircle2, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion/variants";

export default function SourcesPage() {
  const sources = [
    {
      id: "src_1",
      name: "Stripe Production",
      type: "Payment Gateway",
      reliabilityScore: 99.8,
      status: "healthy",
      lastSync: "2 minutes ago",
      issues: "0 issues in last 30 days",
    },
    {
      id: "src_2",
      name: "Silicon Valley Bank",
      type: "Banking Provider",
      reliabilityScore: 94.2,
      status: "warning",
      lastSync: "1 hour ago",
      issues: "2 late files, 1 schema mismatch in last 30 days",
    },
    {
      id: "src_3",
      name: "Shopify US",
      type: "E-Commerce",
      reliabilityScore: 98.5,
      status: "healthy",
      lastSync: "15 minutes ago",
      issues: "0 issues in last 30 days",
    },
  ];

  return (
    <div className="space-y-6">
      <ConsolePageHeader
        title="Source Reliability"
        description="Monitor the health and reliability scoring of your connected data sources."
      />

      <motion.div initial="hidden" animate="visible" variants={fadeUp} className="grid gap-6">
        {sources.map((source) => (
          <Card key={source.id}>
            <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="p-3 bg-secondary/50 rounded-lg">
                <Database className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">{source.name}</h3>
                  <Badge variant="outline">{source.type}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">Last synced: {source.lastSync}</p>
                <div className="flex items-center gap-2 mt-2">
                  {source.status === "healthy" ? (
                    <CheckCircle2 className="w-4 h-4 text-success" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                  )}
                  <span className="text-sm">{source.issues}</span>
                </div>
              </div>
              <div className="w-full md:w-64 space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-medium">Reliability Score</span>
                  <span
                    className={`text-2xl font-bold ${source.reliabilityScore > 98 ? "text-success" : "text-amber-500"}`}
                  >
                    {source.reliabilityScore}%
                  </span>
                </div>
                <Progress value={source.reliabilityScore} className="h-2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>
    </div>
  );
}
