"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, ShieldCheck, Cpu, Layers, GitBranch, Lock, ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ArchitectureModule {
  id: string;
  name: string;
  badge: string;
  image: string;
  alt: string;
  icon: typeof Zap;
  headline: string;
  description: string;
  metrics: { label: string; value: string }[];
  href: string;
  ctaText: string;
}

const MODULES: ArchitectureModule[] = [
  {
    id: "deterministic_core",
    name: "Deterministic Match Engine",
    badge: "Matching Core",
    image: "/platform_core_3d.png",
    alt: "Settler Deterministic Core Processing Engine 3D Visualization",
    icon: Zap,
    headline: "Bit-Perfect Reproducibility at Institutional Scale",
    description:
      "Rules-as-code matching with field-level tolerance controls. The same inputs executed a thousand times produce bit-for-bit identical outputs with zero float drift.",
    metrics: [
      { label: "FLOAT DRIFT", value: "0.0000%" },
      { label: "EXECUTION LATENCY", value: "< 0.38ms" },
      { label: "STATE FINALITY", value: "SEALED" },
    ],
    href: "/platform",
    ctaText: "Explore Platform Engine",
  },
  {
    id: "use_cases",
    name: "Multi-Rail Workflows",
    badge: "Orchestration",
    image: "/use_cases_3d.png",
    alt: "Multi-Rail Settlement and Payment Workflow Orchestration 3D Visualization",
    icon: Layers,
    headline: "Unified Clearing Across Fragmented Payment Rails",
    description:
      "Concurrently reconcile high-velocity e-commerce payouts, complex B2B subscription billing, and multi-currency marketplace escrow into unified, verifiable ledger states.",
    metrics: [
      { label: "SUPPORTED RAILS", value: "25+ Verified" },
      { label: "DISPUTE ARBITRAGE", value: "Zero Leakage" },
      { label: "CURRENCY MAPPINGS", value: "ISO-4217 Auto" },
    ],
    href: "/use-cases",
    ctaText: "View Representative Use Cases",
  },
  {
    id: "continuous_close",
    name: "Continuous T+0 Close",
    badge: "Performance",
    image: "/compare_matrix_3d.png",
    alt: "Continuous T+0 Close Engine vs Legacy Batch Monoliths 3D Visualization",
    icon: Cpu,
    headline: "Eliminating 6-Month Consulting Monoliths",
    description:
      "Modern continuous settlement engine bypassing slow legacy batch queues. Run live reconciliations continuously instead of waiting for month-end close panic.",
    metrics: [
      { label: "CLOSE LATENCY", value: "Real-Time T+0" },
      { label: "SETUP TIME", value: "< 10 Minutes" },
      { label: "AUDIT SAMPLING", value: "0% (100% Proved)" },
    ],
    href: "/compare",
    ctaText: "Compare vs. BlackLine & Modern Treasury",
  },
  {
    id: "capabilities_matrix",
    name: "Evidence Proofpack Vault",
    badge: "Cryptography",
    image: "/capabilities_matrix_3d.png",
    alt: "Settler 4-Tier Sovereign Capability Stack and Merkle Proof Vault 3D",
    icon: ShieldCheck,
    headline: "Mathematical Certainty with SHA-256 Merkle Proofs",
    description:
      "Every reconciliation run seals a portable evidence proofpack. Hand cryptographic proofroots directly to Big-4 auditors without sampling or ad-hoc spreadsheet exports.",
    metrics: [
      { label: "HASH STANDARD", value: "RFC 6962 SHA-256" },
      { label: "OFFLINE VERIFICATION", value: "WASM Supported" },
      { label: "IMMUTABILITY", value: "Tamper-Evident" },
    ],
    href: "/capabilities",
    ctaText: "Inspect Capability Model",
  },
  {
    id: "open_core",
    name: "Open-Core Sovereign Stack",
    badge: "Open Source",
    image: "/open_source_stack_3d.png",
    alt: "Settler Open-Core Sovereign Architecture Stack 3D Visualization",
    icon: GitBranch,
    headline: "Fully Inspectable Rust Kernel & SDKs",
    description:
      "Apache 2.0 licensed core. Run locally via Docker, inspect every line of matching code, integrate with TypeScript & Go SDKs, and eliminate vendor lock-in completely.",
    metrics: [
      { label: "LICENSE", value: "Apache 2.0" },
      { label: "KERNEL RUNTIME", value: "Rust + TigerBeetle" },
      { label: "TELEMETRY", value: "Opt-In Sovereign" },
    ],
    href: "/open-source",
    ctaText: "Browse Open-Source Code",
  },
  {
    id: "isolation_vault",
    name: "Hardened Tenant Isolation",
    badge: "Security",
    image: "/isolation_vault_3d.png",
    alt: "Hardened Tenant Security Isolation Vault 3D",
    icon: Lock,
    headline: "Zero Cross-Tenant Leakage Guaranteed",
    description:
      "All tenant data is strictly isolated at the PostgreSQL RLS, API gateway, and memory execution layer. Double-checked tenant boundaries enforced by runtime guards.",
    metrics: [
      { label: "RLS ENFORCEMENT", value: "100% Covered" },
      { label: "KEY SCOPING", value: "Tenant Bound" },
      { label: "SOC-2 COMPLIANCE", value: "Evidence Ready" },
    ],
    href: "/security-and-audit",
    ctaText: "Review Security Architecture",
  },
];

export function ArchitectureModuleShowcase() {
  const [activeTab, setActiveTab] = useState<string>("deterministic_core");
  const activeModule = MODULES.find((m) => m.id === activeTab) ?? MODULES[0]!;

  return (
    <div className="w-full space-y-10">
      {/* Module Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
        {MODULES.map((module) => {
          const isActive = module.id === activeTab;
          const Icon = module.icon;
          return (
            <button
              key={module.id}
              type="button"
              onClick={() => setActiveTab(module.id)}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all duration-300 cursor-pointer border",
                isActive
                  ? "border-primary/50 bg-primary/10 text-primary shadow-lg shadow-primary/10 ring-1 ring-primary/30"
                  : "border-border/60 bg-card/60 text-muted-foreground hover:border-border hover:text-foreground hover:bg-card"
              )}
            >
              <Icon
                className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground")}
              />
              <span>{module.name}</span>
            </button>
          );
        })}
      </div>

      {/* Main Showcase Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeModule.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.35, ease: "easeInOut" }}
          className="rounded-3xl border border-primary/20 bg-gradient-to-br from-card via-card/90 to-card/60 p-6 sm:p-10 shadow-2xl backdrop-blur-md"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-6 space-y-6">
              <div className="flex items-center gap-2.5">
                <Badge
                  variant="outline"
                  className="border-primary/40 bg-primary/10 text-primary text-xs font-mono font-bold tracking-wider uppercase px-3 py-1"
                >
                  <Sparkles className="mr-1.5 h-3 w-3" />
                  {activeModule.badge}
                </Badge>
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground leading-tight">
                {activeModule.headline}
              </h3>

              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {activeModule.description}
              </p>

              {/* Metric Badges */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                {activeModule.metrics.map((m) => (
                  <div
                    key={m.label}
                    className="rounded-xl border border-border/70 bg-muted/20 p-3 text-center"
                  >
                    <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                      {m.label}
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-foreground font-mono mt-1">
                      {m.value}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <Button asChild size="lg" className="font-semibold shadow-md">
                  <Link href={activeModule.href} className="inline-flex items-center gap-2">
                    {activeModule.ctaText}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Right 3D Visual Column */}
            <div className="lg:col-span-6">
              <div className="group relative aspect-square w-full max-w-[480px] mx-auto overflow-hidden rounded-3xl border border-primary/30 bg-card/80 shadow-2xl transition-all duration-500 hover:border-primary/50 hover:shadow-primary/20">
                <Image
                  src={activeModule.image}
                  alt={activeModule.alt}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/15 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-4 left-4 right-4 rounded-xl border border-white/10 bg-black/70 backdrop-blur-md p-3 text-xs text-white/90 flex items-center justify-between">
                  <span className="font-mono text-[11px] text-cyan-300 font-semibold uppercase">
                    {activeModule.name}
                  </span>
                  <span className="font-mono text-[11px] text-emerald-400 font-bold">
                    VERIFIED INVARIANT
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
