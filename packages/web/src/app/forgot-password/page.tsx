"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandLockup } from "@/components/brand/BrandLockup";
import {
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  Loader2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=/reset-password`;

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (resetError) {
        setError(resetError.message);
        setLoading(false);
        return;
      }

      setSubmitted(true);
      setLoading(false);
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left side: Form */}
      <div className="flex flex-col flex-1 justify-center px-8 lg:px-12 xl:px-24 bg-background">
        <div className="w-full max-w-sm mx-auto space-y-10">
          <div className="space-y-6">
            <Link
              href="/"
              className="inline-block hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
              aria-label="Settler.dev homepage"
            >
              <BrandLockup orientation="stacked" className="max-w-[220px]" priority />
            </Link>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold italic tracking-tight">Reset Password</h1>
              <p className="text-muted-foreground font-medium text-sm leading-relaxed">
                Enter your registered work email and we&apos;ll send you a secure link to reset your
                credentials.
              </p>
            </div>
          </div>

          {submitted ? (
            <div className="space-y-6">
              <div className="flex items-start gap-3 rounded-lg border border-success/30 bg-success/5 px-4 py-4">
                <CheckCircle
                  className="h-5 w-5 mt-0.5 text-success flex-shrink-0"
                  aria-hidden="true"
                />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">Reset link dispatched</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    If an account exists for{" "}
                    <span className="font-medium text-foreground">{email}</span>, you will receive
                    password reset instructions shortly.
                  </p>
                </div>
              </div>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/login" className="flex items-center justify-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Return to sign in
                </Link>
              </Button>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div
                  className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
                  role="alert"
                >
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
                  <span>{error}</span>
                </div>
              )}

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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 border-border/60 bg-muted/20 focus:ring-primary focus:border-primary font-medium"
                  required
                  disabled={loading}
                  autoComplete="email"
                />
              </div>

              <Button className="w-full h-12 text-lg font-bold group" size="lg" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending link…
                  </>
                ) : (
                  <>
                    Send Reset Link
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>

              <div className="text-center pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to sign in
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Right side: Visual / Security Context */}
      <div className="hidden lg:flex flex-col flex-1 relative bg-slate-950 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-slate-900 to-slate-950" />
        <div className="absolute inset-0 bg-grid-white/[0.05] [mask-image:radial-gradient(white,transparent_85%)]" />

        <div className="relative z-10 flex flex-col items-center justify-center h-full text-white p-16">
          <div className="max-w-md space-y-8">
            <div className="p-3 bg-primary/20 rounded-2xl w-fit shadow-2xl ring-1 ring-primary/40">
              <KeyRound size={40} className="text-primary" />
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl font-bold tracking-tight text-foreground italic">
                Cryptographic Identity Recovery
              </h2>
              <p className="text-slate-400 font-medium leading-relaxed">
                Settler enforces scoped access tokens and time-bounded credential rotation. Reset
                links expire within 60 minutes.
              </p>
            </div>
            <div className="pt-6 border-t border-white/10 flex items-center gap-3 text-xs text-slate-400 font-mono">
              <ShieldCheck className="h-4 w-4 text-primary" />
              HMAC-SHA256 Token Validation · Audit Logged
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
