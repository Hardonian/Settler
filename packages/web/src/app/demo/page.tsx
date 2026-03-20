"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, RefreshCw, FileText, Code, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { fadeUp, staggerContainer, staggerItem } from "@/lib/motion/variants";

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-blue-50 to-indigo-50 dark:from-background dark:via-card dark:to-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        {/* Header */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="text-center mb-12 sm:mb-16"
        >
          <motion.div variants={staggerItem} className="mb-4">
            <Badge variant="outline" className="mb-4">
              Demo Mode
            </Badge>
          </motion.div>
          <motion.h1
            variants={staggerItem}
            className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-background via-card to-background dark:from-white dark:via-muted/20 dark:to-white bg-clip-text text-transparent"
          >
            Run the Settler Demo Path
          </motion.h1>
          <motion.p
            variants={staggerItem}
            className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto"
          >
            See one concrete path: run reconciliation, inspect a mismatch, review evidence, and replay the run.
            All demo data is deterministic and reproducible—no authentication required.
          </motion.p>
        </motion.div>


        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="mb-10 rounded-lg border bg-white/80 p-6 dark:bg-card/60"
        >
          <h2 className="text-xl font-semibold text-foreground">How this demo works</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
            <li>Open the reconciliation demo and run deterministic matching across sample systems.</li>
            <li>Inspect mismatches and policy outcomes in the results view.</li>
            <li>Review attached evidence and trace context.</li>
            <li>Replay with the same inputs to verify reproducible output.</li>
          </ol>
        </motion.div>

        {/* Demo Cards */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-12"
        >
          {/* Reconciliation Demo */}
          <motion.div variants={staggerItem}>
            <Card className="h-full hover:shadow-lg transition-shadow" elevation="default">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-4">
                  <RefreshCw className="w-6 h-6 text-white" />
                </div>
                <CardTitle>Reconciliation Run</CardTitle>
                <CardDescription>
                  See how transactions from Stripe, Shopify, QuickBooks, and bank payouts are
                  automatically matched with deterministic rules.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/demo/reconciliation">
                    Start Reconciliation Demo
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Evidence & Receipts Demo */}
          <motion.div variants={staggerItem}>
            <Card className="h-full hover:shadow-lg transition-shadow" elevation="default">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <CardTitle>Evidence & Receipts</CardTitle>
                <CardDescription>
                  Watch receipts transform from raw data into structured JSON, then match to
                  transactions automatically.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/demo/receipts">
                    Open Receipt Evidence Demo
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* API + Policy Playground */}
          <motion.div variants={staggerItem}>
            <Card className="h-full hover:shadow-lg transition-shadow" elevation="default">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mb-4">
                  <Code className="w-6 h-6 text-white" />
                </div>
                <CardTitle>API + Policy Playground</CardTitle>
                <CardDescription>
                  Explore the API with feature flags and plan tiers. See how responses change
                  based on configuration.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/demo/api">
                    Try API + Policy Playground
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Trust & Credibility */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="bg-white dark:bg-card/80 rounded-lg border p-6 sm:p-8"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">
                Deterministic & Reproducible
              </h3>
              <p className="text-muted-foreground mb-4">
                All demo data is static and deterministic. Same inputs always produce same
                outputs. Every transformation includes audit trail IDs and SHA-256 hashes for
                verification.
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>No randomness—all results are reproducible</li>
                <li>Complete audit trails with deterministic hashes</li>
                <li>No database writes—read-only simulation</li>
                <li>No authentication required</li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Back to Home */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="text-center mt-12"
        >
          <Button variant="outline" asChild>
            <Link href="/">Back to Home</Link>
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
