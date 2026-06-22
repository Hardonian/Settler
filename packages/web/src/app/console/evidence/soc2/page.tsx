"use client";

import { ConsolePageHeader } from "@/components/console/ConsolePageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ShieldCheck, Download, ExternalLink, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion/variants";

export default function SOC2EvidencePage() {
  const controls = [
    { id: "CC6.1", name: "Logical Access Security", status: "collecting", count: 142 },
    { id: "CC6.6", name: "Boundary Protection", status: "ready", count: 8 },
    { id: "CC7.2", name: "Security Event Logging", status: "ready", count: 10000 },
    { id: "CC8.1", name: "Change Management", status: "ready", count: 45 },
  ];

  return (
    <div className="space-y-6">
      <ConsolePageHeader
        title="SOC 2 Evidence Collection"
        description="Continuous compliance monitoring and automated evidence collection for your next audit."
        breadcrumbs={[{ label: "Evidence", href: "/console/evidence" }, { label: "SOC 2" }]}
        actions={
          <Button>
            <Download className="w-4 h-4 mr-2" />
            Export Evidence Bundle
          </Button>
        }
      />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="grid gap-6 md:grid-cols-3"
      >
        <Card className="md:col-span-1 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle>Audit Readiness</CardTitle>
            <CardDescription>Continuous monitoring status</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <ShieldCheck className="w-16 h-16 text-primary mb-4" />
            <div className="text-2xl font-bold mb-2">98% Ready</div>
            <p className="text-sm text-center text-muted-foreground mb-4">
              All automated controls are passing. Manual reviews are pending for CC6.1.
            </p>
            <Button variant="outline" className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Force Re-scan
            </Button>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Control Coverage</CardTitle>
            <CardDescription>
              Automated mapping of Settler activities to Trust Services Criteria.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {controls.map((control) => (
                <div
                  key={control.id}
                  className="flex items-center justify-between p-3 border border-border/50 rounded-lg bg-card"
                >
                  <div className="flex items-center gap-3">
                    {control.status === "ready" ? (
                      <CheckCircle2 className="w-5 h-5 text-success" />
                    ) : (
                      <RefreshCw className="w-5 h-5 text-amber-500 animate-spin-slow" />
                    )}
                    <div>
                      <div className="font-medium text-sm">
                        {control.id}: {control.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {control.count} records collected
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    View Logs <ExternalLink className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
