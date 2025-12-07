"use client";

import { CreditCard, Building2, ArrowRightLeft, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaymentMethod {
  name: string;
  description: string;
  icon: React.ReactNode;
  available: boolean;
  note?: string;
  gradient: string;
}

export function PaymentTypes() {
  const paymentMethods: PaymentMethod[] = [
    {
      name: "Credit & Debit Cards",
      description: "Visa, Mastercard, American Express, Discover",
      icon: <CreditCard className="w-6 h-6" />,
      available: true,
      gradient: "from-blue-500 to-indigo-600",
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
    <div className="py-8 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-white">
            Accepted Payment Methods
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Choose the payment method that works best for you
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {paymentMethods.map((method, index) => (
            <div
              key={index}
              className={cn(
                "relative flex items-start gap-4 p-4 rounded-lg border-2",
                method.available
                  ? "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                  : "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 opacity-60"
              )}
              role="listitem"
            >
              <div
                className={cn(
                  "flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center text-white",
                  method.gradient,
                  !method.available && "opacity-50"
                )}
              >
                {method.icon}
              </div>
              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                    {method.name}
                  </h4>
                  {method.available && (
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                  {method.description}
                </p>
                {method.note && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                    {method.note}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Security Note */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            All payments are processed securely through Stripe. We never store your full payment
            details.
          </p>
        </div>
      </div>
    </div>
  );
}
