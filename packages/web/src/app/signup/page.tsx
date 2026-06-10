"use client";

import { Metadata } from "next";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandLockup } from "@/components/brand/BrandLockup";
import { ShieldCheck, ArrowRight, Zap, History, Globe } from "lucide-react";

export default function SignupPage() {
  const [referralCode, setReferralCode] = useState("");

  useEffect(() => {
    try {
      const code = localStorage.getItem("settler_referral_code");
      if (code) setReferralCode(code);
    } catch (e) {
      // ignore
    }
  }, []);

  return (
    <div className="flex min-h-screen">
      {/* Left side: Content support */}
      <div className="hidden lg:flex flex-col flex-1 relative bg-slate-950 overflow-hidden">
        {/* Animated background accent */}
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-slate-900 to-slate-950" />
        <div className="absolute inset-0 bg-grid-white/[0.05] [mask-image:radial-gradient(white,transparent_85%)]" />

        <div className="relative z-10 flex flex-col items-center justify-center h-full text-white p-16">
          <div className="max-w-md space-y-12">
            <div className="space-y-6">
              <div className="p-3 bg-primary/20 rounded-2xl w-fit shadow-2xl ring-1 ring-primary/40">
                <ShieldCheck size={40} className="text-primary" />
              </div>
              <h2 className="text-4xl font-bold leading-tight tracking-tight italic">
                Start Building High-Integrity Reconciliations
              </h2>
              <p className="text-lg text-slate-400 font-medium leading-relaxed">
                Join thousands of organizations using Settler for verifiable financial operations
                and automated drift detection.
              </p>
            </div>

            <div className="grid gap-6">
              {[
                { icon: Zap, text: "Automated Evidence Collection" },
                { icon: History, text: "90-day Immutable Snapshot Storage" },
                { icon: Globe, text: "Standardized Reconciliation Protocols" },
              ].map((feature) => (
                <div key={feature.text} className="flex items-center gap-4 group">
                  <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                    <feature.icon size={20} />
                  </div>
                  <span className="font-bold text-slate-300 group-hover:text-white transition-colors">
                    {feature.text}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-12 border-t border-white/10 italic">
              <p className="text-sm text-slate-500 font-medium">
                &quot;Settler is the first platform that makes reconciliation feel like software
                engineering. No more spreadsheet chaos.&quot;
              </p>
              <div className="mt-4">
                <p className="text-sm font-bold text-slate-300">VP Operations, Fintech Unicorn</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Form */}
      <div className="flex flex-col flex-1 justify-center px-8 lg:px-12 xl:px-24 bg-background">
        <div className="w-full max-w-sm mx-auto space-y-12">
          <div className="space-y-6 text-left">
            <Link
              href="/"
              className="inline-block hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
              aria-label="Settler.dev homepage"
            >
              <BrandLockup orientation="stacked" className="max-w-[220px]" priority />
            </Link>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold italic tracking-tight underline">Get Started</h1>
              <p className="text-muted-foreground font-medium">
                Create your account and start your free 14-day trial.
              </p>
            </div>
          </div>

          <form className="space-y-6">
            <input type="hidden" name="referral_code" value={referralCode} />
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="first-name"
                    className="text-xs font-bold uppercase tracking-widest text-muted-foreground"
                  >
                    First Name
                  </Label>
                  <Input
                    id="first-name"
                    placeholder="John"
                    className="h-12 border-border/60 bg-muted/20 focus:ring-primary focus:border-primary font-medium"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="last-name"
                    className="text-xs font-bold uppercase tracking-widest text-muted-foreground"
                  >
                    Last Name
                  </Label>
                  <Input
                    id="last-name"
                    placeholder="Doe"
                    className="h-12 border-border/60 bg-muted/20 focus:ring-primary focus:border-primary font-medium"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-xs font-bold uppercase tracking-widest text-muted-foreground"
                >
                  Work Email
                </Label>
                <Input
                  id="email"
                  placeholder="name@company.com"
                  type="email"
                  className="h-12 border-border/60 bg-muted/20 focus:ring-primary focus:border-primary font-medium"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-xs font-bold uppercase tracking-widest text-muted-foreground"
                >
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="h-12 border-border/60 bg-muted/20 focus:ring-primary focus:border-primary font-medium"
                  required
                />
              </div>
            </div>

            <Button className="w-full h-12 text-lg font-bold group" size="lg">
              Create Account
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </form>

          <p className="text-xs text-muted-foreground leading-relaxed text-center font-medium">
            By clicking &quot;Create Account&quot;, you agree to our{" "}
            <Link href="/terms" className="text-primary underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-primary underline">
              Privacy Policy
            </Link>
            .
          </p>

          <p className="text-center text-sm font-medium text-muted-foreground pt-4 border-t border-border/40">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-bold text-primary hover:underline underline-offset-4"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
