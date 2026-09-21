"use client";

import Link from "next/link";
import { ConsolePageHeader } from "@/components/console/ConsolePageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, FileCheck, Download, ArrowRight, Activity, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion/variants";

export default function EvidenceHubPage() {
  const hubs = [
    {
      title: "SOC 2 Type II Evidence Collector",
      description:
        "Continuous compliance control mapping, automated Trust Services Criteria telemetry, and auditor bundle generation.",
      href: "/console/evidence/soc2",
      badge: "Evidence mapping",
      badgeColor: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
      icon: ShieldCheck,
    },
    {
      title: "SIEM & Security Telemetry",
      description:
        "Journal event export, downstream SIEM handoff, and tamper-evident administrative action logs.",
      href: "/console/evidence/siem",
      badge: "Deployment validation",
      badgeColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
      icon: Activity,
    },
    {
      title: "Proof Explorer & WASM Replay",
      description:
        "Search and mathematically verify RFC 6962 SHA-256 Merkle proofpacks with sub-millisecond offline verification.",
      href: "/console/proof-explorer",
      badge: "Deterministic",
      badgeColor: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
      icon: FileCheck,
    },
    {
      title: "Tamper-Evident Receipts & Hash Chains",
      description:
        "Cryptographic hash chain receipts for individual settlement runs, transaction batches, and bank close records.",
      href: "/console/receipts-hash",
      badge: "SHA-256 Sealed",
      badgeColor: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
      icon: Lock,
    },
  ];

  return (
    <div className="space-y-8">
      <ConsolePageHeader
        title="Evidence & Compliance Hub"
        description="Cryptographic proofpacks, compliance evidence mapping, and tamper-evident security telemetry."
        breadcrumbs={[{ label: "Console", href: "/console" }, { label: "Evidence" }]}
        actions={
          <Button asChild>
            <Link href="/console/evidence/soc2">
              <Download className="w-4 h-4 mr-2" />
              Export Full Evidence Bundle
            </Link>
          </Button>
        }
      />

      {/* Top Metrics Row */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-semibold">
              Certification posture
            </CardDescription>
            <CardTitle className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <ShieldCheck className="h-6 w-6" />
              Program in progress
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Evidence collection supports audit preparation; it is not certification
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-semibold">
              Proof verification
            </CardDescription>
            <CardTitle className="text-2xl font-extrabold text-foreground">Deterministic</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Verify current proofpacks with the shipped verification path
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-semibold">
              SIEM handoff
            </CardDescription>
            <CardTitle className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">
              Validate target
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Export mappings and throughput vary by deployment
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-semibold">
              Browser verifier
            </CardDescription>
            <CardTitle className="text-2xl font-extrabold text-purple-600 dark:text-purple-400">
              Available
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Measure latency against the target proofpack and browser
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Hub Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {hubs.map((hub) => {
          const Icon = hub.icon;
          return (
            <Card
              key={hub.title}
              className="border-border/70 bg-card hover:border-primary/40 transition-all flex flex-col justify-between"
            >
              <CardHeader>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="p-2.5 rounded-lg bg-primary/10 text-primary w-fit">
                    <Icon className="h-5 w-5" />
                  </div>
                  <Badge variant="outline" className={`text-xs font-bold ${hub.badgeColor}`}>
                    {hub.badge}
                  </Badge>
                </div>
                <CardTitle className="text-lg font-bold">{hub.title}</CardTitle>
                <CardDescription className="text-xs sm:text-sm leading-relaxed mt-1">
                  {hub.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button
                  asChild
                  variant="outline"
                  className="w-full justify-between font-semibold group"
                >
                  <Link href={hub.href}>
                    <span>Open {hub.title.split(" ")[0]}</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
