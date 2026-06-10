"use client";

import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Zap, ShieldCheck, Cpu } from "lucide-react";
import { toast } from "sonner";

export default function UpgradePage() {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUpgrade = async (tier: string) => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/v1/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create checkout session");

      // Redirect to Stripe
      window.location.href = data.url;
    } catch (err) {
      toast.error("Upgrade Failed", {
        description: err instanceof Error ? err.message : "Unknown error occurred.",
      });
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8 pb-8 max-w-5xl mx-auto">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">Upgrade Your Plan</h1>
        <p className="mt-4 text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          Scale your reconciliation operations seamlessly. Choose a plan tailored to your
          transaction volume and compliance requirements.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-8">
        {/* Pro Tier */}
        <Card className="border-border/40 glass flex flex-col">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Pro</CardTitle>
            <CardDescription>
              For growing businesses needing robust ledger matching.
            </CardDescription>
            <div className="mt-4">
              <span className="text-4xl font-bold">$299</span>
              <span className="text-muted-foreground">/mo</span>
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">Up to 100,000 matches/mo</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">Standard Connectors (Stripe)</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">7-day audit retention</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full font-bold"
              variant="outline"
              disabled={isProcessing}
              onClick={() => handleUpgrade("pro")}
            >
              Select Pro
            </Button>
          </CardFooter>
        </Card>

        {/* Enterprise Tier */}
        <Card className="border-primary/50 bg-primary/5 shadow-2xl shadow-primary/20 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 px-3 py-1 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest rounded-bl-lg">
            Recommended
          </div>
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Scale
            </CardTitle>
            <CardDescription>Advanced AI and reporting for high-volume operators.</CardDescription>
            <div className="mt-4">
              <span className="text-4xl font-bold">$999</span>
              <span className="text-muted-foreground">/mo</span>
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">Up to 1,000,000 matches/mo</span>
              </li>
              <li className="flex items-center gap-3">
                <Cpu className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">AI CSV Schema Ingestion</span>
              </li>
              <li className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">Month-End Ledger Locks</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">SOC2 Automation Exports</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full font-bold bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={isProcessing}
              onClick={() => handleUpgrade("scale")}
            >
              Select Scale
            </Button>
          </CardFooter>
        </Card>

        {/* Custom Tier */}
        <Card className="border-border/40 glass flex flex-col">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Enterprise</CardTitle>
            <CardDescription>Dedicated infrastructure and strict isolation.</CardDescription>
            <div className="mt-4">
              <span className="text-4xl font-bold">Custom</span>
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">Unlimited match volume</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">Dedicated Tenant Database</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">99.99% Uptime SLA</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full font-bold" variant="outline" asChild>
              <a href="mailto:sales@settler.dev">Contact Sales</a>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
