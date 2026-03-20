import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SettlerLogo } from "@/components/brand/SettlerLogo";
import { ShieldCheck, ArrowRight, Zap, History, Globe } from "lucide-react";

export const metadata: Metadata = {
  title: "Login | Settler",
  description: "Secure access to your reconciliation control plane.",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen">
      {/* Left side: Form */}
      <div className="flex flex-col flex-1 justify-center px-8 lg:px-12 xl:px-24 bg-background">
        <div className="w-full max-w-sm mx-auto space-y-12">
          <div className="space-y-6">
            <Link href="/" className="inline-block hover:opacity-80 transition-opacity">
              <SettlerLogo className="h-10 w-auto" />
            </Link>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold italic tracking-tight italic">Welcome Back</h1>
              <p className="text-muted-foreground font-medium">
                Enter your credentials to access the Control Plane.
              </p>
            </div>
          </div>

          <form className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-xs font-bold uppercase tracking-widest text-muted-foreground"
                >
                  Email Address
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
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="password"
                    className="text-xs font-bold uppercase tracking-widest text-muted-foreground"
                  >
                    Password
                  </Label>
                  <Link
                    href="/forgot-password"
                    size="sm"
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  className="h-12 border-border/60 bg-muted/20 focus:ring-primary focus:border-primary font-medium"
                  required
                />
              </div>
            </div>

            <Button className="w-full h-12 text-lg font-bold group" size="lg">
              Sign In
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/60" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest bg-background px-4 text-muted-foreground">
              Secure Auth Protocol Enforced
            </div>
          </div>

          <p className="text-center text-sm font-medium text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-bold text-primary hover:underline underline-offset-4"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>

      {/* Right side: Visual / Brand Support */}
      <div className="hidden lg:flex flex-col flex-1 relative bg-slate-950 overflow-hidden">
        {/* Animated background accent */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-slate-900 to-slate-950" />
        <div className="absolute inset-0 bg-grid-white/[0.05] [mask-image:radial-gradient(white,transparent_85%)]" />

        <div className="relative z-10 flex flex-col items-center justify-center h-full text-white p-16">
          <div className="max-w-md space-y-12">
            <div className="space-y-6">
              <div className="p-3 bg-primary/20 rounded-2xl w-fit shadow-2xl ring-1 ring-primary/40">
                <ShieldCheck size={40} className="text-primary" />
              </div>
              <h2 className="text-4xl font-bold leading-tight tracking-tight italic">
                Deterministic Financial Integrity
              </h2>
              <p className="text-lg text-slate-400 font-medium leading-relaxed">
                Settler ensures your reconciliation flows are cryptographically verifiable and
                perfectly reproducible.
              </p>
            </div>

            <div className="grid gap-6">
              {[
                { icon: Zap, text: "Real-time Drift Detection" },
                { icon: History, text: "Point-in-time Execution Replay" },
                { icon: Globe, text: "Multi-Source Native Adapters" },
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
                &quot;Settler transformed how we audit our payment flows. Total confidence, absolute
                determinism.&quot;
              </p>
              <div className="mt-4">
                <p className="text-sm font-bold text-slate-300">CTO, Leading Fintech Provider</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
