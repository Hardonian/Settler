"use client";

import React, { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { AmbientLightOrbs } from "@/components/site/HomeInfographics";
import { AstraApiConsole } from "@/components/astra/AstraApiConsole";
import { AstraFlowEngine } from "@/components/astra/AstraFlowEngine";
import { AstraCrucibleChaos } from "@/components/astra/AstraCrucibleChaos";
import { AstraMerkleInspector } from "@/components/astra/AstraMerkleInspector";
import { AstraThreatIntelligence } from "@/components/astra/AstraThreatIntelligence";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UiLink } from "@/components/ui/link";
import { CopyButton } from "@/components/ui/CopyButton";
import {
  Terminal,
  Workflow,
  Flame,
  Fingerprint,
  ArrowRight,
  Zap,
  Sparkles,
  BookOpen,
  BrainCircuit,
} from "lucide-react";

type AstraTab = "console" | "flow" | "crucible" | "threats" | "merkle";

export default function AstraPage() {
  const [activeTab, setActiveTab] = useState<AstraTab>("console");
  const [activeInstallTab, setActiveInstallTab] = useState<
    "pnpm" | "npm" | "python" | "go" | "rust"
  >("pnpm");

  const getInstallCmd = () => {
    switch (activeInstallTab) {
      case "pnpm":
        return "pnpm add @settler/sdk @settler/types";
      case "npm":
        return "npm install @settler/sdk @settler/types";
      case "python":
        return "pip install settler-reconciliation-sdk";
      case "go":
        return "go get github.com/settler/sdk-go@latest";
      case "rust":
        return "cargo add settler-kernel settler-protocol";
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-slate-950">
      <AmbientLightOrbs />
      <Navigation />

      <main className="relative z-10 mx-auto max-w-7xl px-4 pt-28 pb-24 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="mx-auto max-w-3xl text-center mb-12">
          <Badge
            variant="outline"
            className="mb-4 border-cyan-500/40 bg-cyan-500/10 px-3.5 py-1 text-xs font-bold text-cyan-300 backdrop-blur-md"
          >
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            ASTRA DEVELOPER PLATFORM // THE STRIPE FOR RECONCILIATION
          </Badge>

          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Programmable Settlement &amp;{" "}
            <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Sovereign Ledger APIs
            </span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-400 leading-relaxed">
            Eliminate weeks of brittle spreadsheet reconciliation and opaque processor reporting.
            Settler Astra provides deterministic multi-rail APIs, sub-millisecond invariant
            assertions, and cryptographic Merkle root sealing for Stripe, PayPal, and enterprise
            ERPs.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-bold text-sm shadow-xl shadow-cyan-950/40"
            >
              <UiLink href="/onboarding">
                Get Instant API Keys <ArrowRight className="ml-2 h-4 w-4" />
              </UiLink>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-slate-700 bg-slate-900/60 text-slate-200 hover:bg-slate-800 text-sm font-semibold"
            >
              <UiLink href="/docs/api">
                <BookOpen className="mr-2 h-4 w-4 text-cyan-400" />
                Read API Reference
              </UiLink>
            </Button>
          </div>
        </div>

        {/* Live Infrastructure Metrics Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 backdrop-blur">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Settlement Throughput
            </div>
            <div className="mt-1 font-mono text-2xl font-black text-white">142,890</div>
            <div className="text-xs text-emerald-400 font-medium mt-0.5">Transactions / Sec</div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 backdrop-blur">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Floating-Point Drift
            </div>
            <div className="mt-1 font-mono text-2xl font-black text-emerald-400">0.0000%</div>
            <div className="text-xs text-slate-400 font-medium mt-0.5">Strict Integer Cents</div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 backdrop-blur">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Bilateral Matching Latency
            </div>
            <div className="mt-1 font-mono text-2xl font-black text-cyan-400">18.4ms</div>
            <div className="text-xs text-slate-400 font-medium mt-0.5">P99 Core Engine</div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 backdrop-blur">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Tenant Isolation
            </div>
            <div className="mt-1 font-mono text-2xl font-black text-purple-400">100.0%</div>
            <div className="text-xs text-slate-400 font-medium mt-0.5">RLS &amp; Repo Guarded</div>
          </div>
        </div>

        {/* Interactive Astra Engine Mode Switcher */}
        <div className="mb-6 flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/80 p-1.5 backdrop-blur-lg">
          <button
            onClick={() => setActiveTab("console")}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition-all ${
              activeTab === "console"
                ? "bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-lg shadow-cyan-950/50"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <Terminal className="h-4 w-4" />
            <span>Interactive API Sandbox</span>
          </button>

          <button
            onClick={() => setActiveTab("flow")}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition-all ${
              activeTab === "flow"
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-950/50"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <Workflow className="h-4 w-4" />
            <span>Programmable Flow DAG</span>
          </button>

          <button
            onClick={() => setActiveTab("crucible")}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition-all ${
              activeTab === "crucible"
                ? "bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-lg shadow-rose-950/50"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <Flame className="h-4 w-4" />
            <span>Crucible Chaos Lab</span>
          </button>

          <button
            onClick={() => setActiveTab("threats")}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition-all ${
              activeTab === "threats"
                ? "bg-gradient-to-r from-rose-600 to-indigo-600 text-white shadow-lg shadow-rose-950/50"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <BrainCircuit className="h-4 w-4" />
            <span>Threat Intelligence</span>
          </button>

          <button
            onClick={() => setActiveTab("merkle")}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition-all ${
              activeTab === "merkle"
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-950/50"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <Fingerprint className="h-4 w-4" />
            <span>Merkle Proof Inspector</span>
          </button>
        </div>

        {/* Tab Content Display */}
        <div className="mb-16">
          {activeTab === "console" && <AstraApiConsole />}
          {activeTab === "flow" && <AstraFlowEngine />}
          {activeTab === "crucible" && <AstraCrucibleChaos />}
          {activeTab === "threats" && <AstraThreatIntelligence />}
          {activeTab === "merkle" && <AstraMerkleInspector />}
        </div>

        {/* Quickstart SDK Installation Strip */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 backdrop-blur mb-16">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-cyan-400" />
                <h3 className="text-lg font-bold text-white">Integrate in Minutes</h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
                Install Settler Astra across your backend stack with native client SDKs engineered
                for TypeScript, Python, Go, and Rust.
              </p>
            </div>

            <div className="w-full md:w-auto">
              <div className="flex items-center gap-2 mb-2">
                {(["pnpm", "npm", "python", "go", "rust"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveInstallTab(tab)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                      activeInstallTab === tab
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 font-mono text-xs text-slate-200">
                <span className="text-cyan-300">{getInstallCmd()}</span>
                <CopyButton text={getInstallCmd()} size="sm" />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Conversion CTA */}
        <section className="rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/40 via-slate-900/80 to-purple-950/40 p-8 sm:p-12 text-center backdrop-blur-lg">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Ready to Replace Fragile ETL with Astra?
            </h2>
            <p className="mt-3 text-sm text-slate-300 leading-relaxed">
              Join enterprise fintechs and global platforms that reconcile billions with
              mathematical certainty. Start testing with sandbox API keys or upload raw statements
              directly.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
              <Button
                asChild
                size="lg"
                className="bg-white text-slate-950 hover:bg-slate-100 font-bold px-6 shadow-lg shadow-white/10"
              >
                <UiLink href="/onboarding">
                  Launch Connection Wizard <ArrowRight className="ml-2 h-4 w-4" />
                </UiLink>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-white/20 text-white hover:bg-white/10 font-semibold"
              >
                <UiLink href="/document-onboarding">Try Document Onboarding</UiLink>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
