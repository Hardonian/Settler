"use client";

import { useEffect, useRef, useState } from "react";
import { SafeImage } from "@/components/SafeImage";
import { Shield, Lock, CreditCard, CheckCircle2, Clock, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrustIndicator {
  icon: React.ReactNode;
  label: string;
  description?: string;
  badge?: string;
}

export function PurchaseScrutiny() {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    const currentElement = containerRef.current;
    if (currentElement) {
      observer.observe(currentElement);
    }

    return () => {
      if (currentElement) {
        observer.unobserve(currentElement);
      }
    };
  }, []);

  const trustIndicators: TrustIndicator[] = [
    {
      icon: <Shield className="w-6 h-6" />,
      label: "30-Day Money-Back Guarantee",
      description: "Not satisfied? Get a full refund—no questions asked, no hassle",
      badge: "Risk-Free",
    },
    {
      icon: <Lock className="w-6 h-6" />,
      label: "Enterprise-Grade Security",
      description: "AES-256 encryption, SOC 2 Type II certification in progress (Q2 2026)",
      badge: "Secure",
    },
    {
      icon: <CreditCard className="w-6 h-6" />,
      label: "PCI-DSS Compliant Payments",
      description: "Stripe and PayPal handle all payments with bank-level security",
      badge: "PCI-DSS",
    },
    {
      icon: <CheckCircle2 className="w-6 h-6" />,
      label: "No Credit Card Required",
      description: "Start your 30-day free trial with full access to all features—cancel anytime",
      badge: "Zero Risk",
    },
    {
      icon: <Clock className="w-6 h-6" />,
      label: "Cancel Anytime, No Fees",
      description: "No long-term contracts, no cancellation fees, no commitments",
      badge: "Flexible",
    },
    {
      icon: <Users className="w-6 h-6" />,
      label: "Trusted by Early Adopters",
      description: "Processing transactions with high accuracy",
      badge: "Trusted",
    },
  ];

  const prefersReducedMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <div
      ref={containerRef}
      className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800"
      role="region"
      aria-label="Purchase security and trust indicators"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-slate-900 dark:text-white">
            Try Risk-Free. Buy with Confidence.
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            We partner with Stripe and PayPal to process your payments securely. Enterprise-grade
            security protects your data. Start your 30-day free trial—no credit card required,
            cancel anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trustIndicators.map((indicator, index) => (
            <div
              key={index}
              className={cn(
                "bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 shadow-sm",
                "transition-all duration-500 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600",
                "flex flex-col gap-4",
                isVisible
                  ? "opacity-100 translate-y-0 scale-100"
                  : "opacity-0 translate-y-4 scale-95"
              )}
              style={{
                transitionDelay: prefersReducedMotion ? "0ms" : `${index * 100}ms`,
              }}
              role="listitem"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 flex items-center justify-center text-white">
                  {indicator.icon}
                </div>
                <div className="flex-grow">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                      {indicator.label}
                    </h3>
                    {indicator.badge && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 rounded">
                        {indicator.badge}
                      </span>
                    )}
                  </div>
                  {indicator.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {indicator.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Payment Processors - Trusted Partners */}
        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
          <div className="text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Secure payments through trusted partners
            </p>
            <div className="flex items-center justify-center gap-6 flex-wrap">
              <div className="flex flex-col items-center gap-2 px-4 py-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <SafeImage
                  src="/assets/icons/stripe-badge.svg"
                  alt="Stripe payment processor badge"
                  width={80}
                  height={40}
                  className="opacity-80"
                  fallbackTitle="Stripe"
                  fallbackCaption="Payment processor"
                  unoptimized
                  sizes="80px"
                />
                <p className="text-xs text-slate-600 dark:text-slate-400">Credit Cards</p>
              </div>
              <div className="flex flex-col items-center gap-2 px-4 py-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <SafeImage
                  src="/assets/icons/paypal-payment-badge.svg"
                  alt="PayPal payment processor badge"
                  width={80}
                  height={40}
                  className="opacity-80"
                  fallbackTitle="PayPal"
                  fallbackCaption="Payment processor"
                  unoptimized
                  sizes="80px"
                />
                <p className="text-xs text-slate-600 dark:text-slate-400">PayPal</p>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                <Lock className="w-4 h-4" />
                <span>SSL Encrypted</span>
                <Shield className="w-4 h-4 ml-2" />
                <span>PCI-DSS Compliant</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
