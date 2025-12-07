"use client";

import { CreditCard, Building2, ArrowRightLeft, CheckCircle2, Lock, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface PaymentMethod {
  name: string;
  description: string;
  icon: React.ReactNode;
  available: boolean;
  note?: string;
  gradient: string;
  cardTypes?: string[];
  processor?: string;
  logo?: string;
}

export function PaymentTypes() {
  const paymentMethods: PaymentMethod[] = [
    {
      name: "Credit & Debit Cards",
      description: "All major card networks accepted",
      icon: <CreditCard className="w-6 h-6" />,
      available: true,
      processor: "Stripe",
      cardTypes: ["Visa", "Mastercard", "American Express", "Discover", "JCB", "Diners Club"],
      gradient: "from-blue-500 to-indigo-600",
      logo: "/assets/icons/stripe-badge.svg",
    },
    {
      name: "PayPal",
      description: "Pay with your PayPal account or credit card",
      icon: <CreditCard className="w-6 h-6" />,
      available: true,
      processor: "PayPal",
      gradient: "from-blue-600 to-blue-800",
      logo: "/assets/icons/paypal-payment-badge.svg",
    },
    {
      name: "ACH Transfer",
      description: "Direct bank transfer (US only)",
      icon: <Building2 className="w-6 h-6" />,
      available: true,
      note: "Available for Commercial+ plans",
      gradient: "from-green-500 to-emerald-600",
    },
    {
      name: "Wire Transfer",
      description: "International wire transfers",
      icon: <ArrowRightLeft className="w-6 h-6" />,
      available: true,
      note: "Enterprise plans only",
      gradient: "from-purple-500 to-pink-600",
    },
  ];

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h3 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">
            Secure Payment Options
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Multiple payment methods available. All transactions secured by Stripe.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-8">
          {paymentMethods.map((method, index) => (
            <div
              key={index}
              className={cn(
                "relative flex flex-col gap-4 p-6 rounded-xl border-2",
                method.available
                  ? "bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow"
                  : "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 opacity-60"
              )}
              role="listitem"
            >
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    "flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br flex items-center justify-center text-white",
                    method.gradient,
                    !method.available && "opacity-50"
                  )}
                >
                  {method.icon}
                </div>
                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-base font-semibold text-slate-900 dark:text-white">
                      {method.name}
                    </h4>
                    {method.available && (
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    {method.description}
                  </p>
                  {method.note && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                      {method.note}
                    </p>
                  )}
                </div>
              </div>
              {method.processor && (
                <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2 mb-2">
                    {method.logo && (
                      <Image
                        src={method.logo}
                        alt={method.processor}
                        width={60}
                        height={30}
                        className="opacity-80"
                        unoptimized
                      />
                    )}
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Powered by {method.processor}
                    </span>
                  </div>
                  {method.cardTypes && (
                    <>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                        Accepted cards:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {method.cardTypes.map((card, cardIndex) => (
                          <span
                            key={cardIndex}
                            className="px-2 py-1 text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-700 dark:text-slate-300"
                          >
                            {card}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Security & Payment Processors */}
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Stripe */}
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900 rounded-xl border border-blue-200 dark:border-slate-700">
              <div className="w-16 h-16 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 flex-shrink-0">
                <Image
                  src="/assets/icons/stripe-badge.svg"
                  alt="Stripe"
                  width={70}
                  height={35}
                  className="opacity-90"
                  unoptimized
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                  Credit Cards via Stripe
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Industry-leading payment security & PCI-DSS compliant
                </p>
              </div>
            </div>

            {/* PayPal */}
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900 rounded-xl border border-blue-200 dark:border-slate-700">
              <div className="w-16 h-16 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 flex-shrink-0">
                <Image
                  src="/assets/icons/paypal-payment-badge.svg"
                  alt="PayPal"
                  width={70}
                  height={35}
                  className="opacity-90"
                  unoptimized
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                  PayPal Payments
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Secure PayPal account or credit card payments
                </p>
              </div>
            </div>
          </div>

          {/* Security Badges */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <Lock className="w-4 h-4" />
              <span>SSL Encrypted</span>
            </div>
            <div className="h-4 w-px bg-slate-300 dark:bg-slate-600" />
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <Shield className="w-4 h-4" />
              <span>PCI-DSS Compliant</span>
            </div>
            <div className="h-4 w-px bg-slate-300 dark:bg-slate-600" />
            <div className="text-xs text-slate-600 dark:text-slate-400">
              <span className="font-semibold">Trusted Partners:</span> Stripe & PayPal
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-4">
            All payments are processed securely through trusted partners. We never store your full
            payment details on our servers.
          </p>
        </div>
      </div>
    </div>
  );
}
