/**
 * User Sign-up Page
 *
 * Data Flow Diagram:
 * User Sign-up (Vercel Form) → Next.js Server Action → Supabase profiles table (RLS Check)
 * → Profile Page Reload (Server Component Fetch)
 */

"use client";

import { signUpUser } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { UserPlus, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { validateEmail, validatePassword } from "@/lib/utils/error-messages";
import { cn } from "@/lib/utils";

function SignUpForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<"weak" | "medium" | "strong" | null>(null);
  const [touched, setTouched] = useState({ email: false, password: false });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (formData: FormData) => {
    const emailValue = formData.get("email") as string;
    const passwordValue = formData.get("password") as string;
    const name = formData.get("name") as string;

    // Reset error
    setError(null);

    // Client-side validation
    const emailValidation = validateEmail(emailValue);
    const passwordValidation = validatePassword(passwordValue);

    if (!emailValidation.valid || !passwordValidation.valid) {
      setError(emailValidation.error || passwordValidation.error || "Please fix the errors above");
      return;
    }

    startTransition(async () => {
      const result = await signUpUser(emailValue, passwordValue, name);

      if (result.success) {
        router.push("/dashboard");
      } else {
        setError(result.error || "Failed to create account");
      }
    });
  };

  // Real-time email validation
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    if (touched.email || value.length > 0) {
      const validation = validateEmail(value);
      setEmailError(validation.valid ? null : validation.error || null);
    }
  };

  // Real-time password validation
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    if (touched.password || value.length > 0) {
      const validation = validatePassword(value);
      setPasswordError(validation.valid ? null : validation.error || null);
      setPasswordStrength(validation.strength || null);
    }
  };

  const handleBlur = (field: "email" | "password") => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    if (field === "email") {
      const validation = validateEmail(email);
      setEmailError(validation.valid ? null : validation.error || null);
    } else if (field === "password") {
      const validation = validatePassword(password);
      setPasswordError(validation.valid ? null : validation.error || null);
      setPasswordStrength(validation.strength || null);
    }
  };

  return (
    <form action={handleSubmit} className="space-y-6" noValidate method="POST">
      <div>
        <Label htmlFor="name" className="mb-2.5 block">
          Name (Optional)
        </Label>
        <Input id="name" name="name" type="text" placeholder="Your name" className="w-full" />
      </div>

      <div>
        <Label htmlFor="email" className="mb-2.5 block">
          Email *
        </Label>
        <div className="relative">
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            required
            value={email}
            onChange={handleEmailChange}
            onBlur={() => handleBlur("email")}
            className={cn(
              "w-full pr-10",
              emailError && "border-red-500 focus:border-red-500 focus:ring-red-500",
              !emailError && email && "border-green-500 focus:border-green-500 focus:ring-green-500"
            )}
            aria-describedby={emailError ? "email-error" : email ? "email-success" : undefined}
            aria-invalid={emailError ? "true" : "false"}
          />
          {email && !emailError && (
            <CheckCircle2
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500"
              aria-hidden="true"
            />
          )}
        </div>
        {emailError && (
          <p id="email-error" className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" aria-hidden="true" />
            {emailError}
          </p>
        )}
        {email && !emailError && (
          <p id="email-success" className="text-xs text-green-600 dark:text-green-400 mt-1">
            Email looks good
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="password" className="mb-2.5 block">
          Password *
        </Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            required
            minLength={8}
            value={password}
            onChange={handlePasswordChange}
            onBlur={() => handleBlur("password")}
            className={cn(
              "w-full pr-10",
              passwordError && "border-red-500 focus:border-red-500 focus:ring-red-500",
              !passwordError && password && passwordStrength && "border-green-500 focus:border-green-500 focus:ring-green-500"
            )}
            aria-describedby="password-help password-error password-strength"
            aria-invalid={passwordError ? "true" : "false"}
          />
          {password && !passwordError && passwordStrength && (
            <CheckCircle2
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500"
              aria-hidden="true"
            />
          )}
        </div>
        <p id="password-help" className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Must be at least 8 characters
        </p>
        {passwordStrength && !passwordError && (
          <div id="password-strength" className="mt-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Password strength:
              </span>
              <span
                className={cn(
                  "text-xs font-semibold",
                  passwordStrength === "strong" && "text-green-600 dark:text-green-400",
                  passwordStrength === "medium" && "text-yellow-600 dark:text-yellow-400",
                  passwordStrength === "weak" && "text-red-600 dark:text-red-400"
                )}
              >
                {passwordStrength.charAt(0).toUpperCase() + passwordStrength.slice(1)}
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
              <div
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  passwordStrength === "strong" && "w-full bg-green-500",
                  passwordStrength === "medium" && "w-2/3 bg-yellow-500",
                  passwordStrength === "weak" && "w-1/3 bg-red-500"
                )}
              />
            </div>
          </div>
        )}
        {passwordError && (
          <p id="password-error" className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" aria-hidden="true" />
            {passwordError}
          </p>
        )}
      </div>

      {error && (
        <div
          id="form-error"
          className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md"
          role="alert"
          aria-live="polite"
        >
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" aria-hidden="true" />
          <p id="password-error" className="text-sm text-red-800 dark:text-red-200">
            {error}
          </p>
        </div>
      )}

      <Button
        type="submit"
        disabled={isPending}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:from-electric-cyan dark:to-electric-blue dark:hover:from-electric-cyan/90 dark:hover:to-electric-blue/90 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-busy={isPending}
      >
        {isPending ? (
          <>
            <span className="animate-spin mr-2">⏳</span>
            Creating Account...
          </>
        ) : (
          <>
            <UserPlus className="w-4 h-4 mr-2" />
            Create Account
          </>
        )}
      </Button>
    </form>
  );
}

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-black">
      <Navigation />

      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 md:p-8 border border-slate-200 dark:border-slate-700">
          <div className="text-center mb-10">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-4">
              Start Your 30-Day Free Trial
            </h1>
            <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 mb-4 leading-relaxed px-2">
              Get full access to all features for 30 days. Process unlimited transactions, connect all platforms, and access all cookbooks.
            </p>
            <p className="text-xs md:text-sm font-semibold text-green-600 dark:text-green-400 mb-4">
              ✓ No credit card required • ✓ Cancel anytime • ✓ Full access
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Join 500+ companies using Settler
            </p>
          </div>

          <SignUpForm />

          <div className="mt-6 md:mt-8 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Already have an account?{" "}
              <Link
                href="/dashboard"
                className="text-blue-600 dark:text-electric-cyan hover:underline font-medium"
              >
                Go to Dashboard
              </Link>
            </p>
          </div>
        </div>

        {/* Trial Benefits Info */}
        <div className="mt-8 md:mt-10 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 md:p-8 border-2 border-blue-200 dark:border-blue-800">
          <h3 className="text-sm md:text-base font-bold text-blue-900 dark:text-blue-300 mb-5">
            What You Get in Your 30-Day Free Trial
          </h3>
          <ul className="text-xs md:text-sm text-blue-800 dark:text-blue-400 space-y-3">
            <li className="flex items-start gap-3">
              <span className="text-green-600 dark:text-green-400 font-bold flex-shrink-0 mt-0.5">✓</span>
              <span><strong>Full access to all features</strong> — no limits, no restrictions</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-600 dark:text-green-400 font-bold flex-shrink-0 mt-0.5">✓</span>
              <span><strong>Unlimited transaction matching</strong> — process as many as you need</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-600 dark:text-green-400 font-bold flex-shrink-0 mt-0.5">✓</span>
              <span><strong>All 10+ platform adapters</strong> — connect Shopify, Stripe, PayPal, and more</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-600 dark:text-green-400 font-bold flex-shrink-0 mt-0.5">✓</span>
              <span><strong>Complete cookbook library</strong> — 10+ ready-to-use workflows</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-600 dark:text-green-400 font-bold flex-shrink-0 mt-0.5">✓</span>
              <span><strong>Priority email support</strong> — get help when you need it</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-600 dark:text-green-400 font-bold flex-shrink-0 mt-0.5">✓</span>
              <span><strong>No credit card required</strong> — start free, upgrade only if you love it</span>
            </li>
          </ul>
          <div className="mt-5 pt-5 border-t border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
              <strong>After 30 days:</strong> Your trial converts to the Free plan (1,000 transactions/month) unless you upgrade. No charges, no surprises.
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
