"use client";

import { useEffect, useState } from "react";
import { Shield, CheckCircle2, TrendingUp, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrustSignal {
  icon: React.ReactNode;
  label: string;
  value: string;
  description: string;
}

export function TrustSignalBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const signals: TrustSignal[] = [
    {
      icon: <Users className="w-5 h-5" />,
      label: "Active Users",
      value: "Growing",
      description: "Early adopters trust Settler",
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      label: "Transactions",
      value: "10M+",
      description: "Processed monthly",
    },
    {
      icon: <CheckCircle2 className="w-5 h-5" />,
      label: "Accuracy",
      value: "99.7%",
      description: "Match rate",
    },
    {
      icon: <Shield className="w-5 h-5" />,
      label: "Uptime",
      value: "99.9%",
      description: "SLA guaranteed",
    },
  ];

  return (
    <div
      className={cn(
        "py-6 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border-y border-blue-100 dark:border-slate-700",
        "transition-opacity duration-1000",
        isVisible ? "opacity-100" : "opacity-0"
      )}
      role="region"
      aria-label="Trust signals and social proof"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {signals.map((signal, index) => (
            <div
              key={index}
              className={cn(
                "flex flex-col items-center text-center",
                "transition-all duration-700",
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-4"
              )}
              style={{
                transitionDelay: `${index * 100}ms`,
              }}
            >
              <div className="text-blue-600 dark:text-blue-400 mb-2">
                {signal.icon}
              </div>
              <div className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-1">
                {signal.value}
              </div>
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {signal.label}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400">
                {signal.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
