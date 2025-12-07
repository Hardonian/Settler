"use client";

import { useEffect, useState, useRef } from "react";
import { Users, TrendingUp, Zap, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Stat {
  icon: React.ReactNode;
  value: string;
  label: string;
  suffix?: string;
  color: string;
}

export function SocialProofCounter() {
  const [isVisible, setIsVisible] = useState(false);
  const [counts, setCounts] = useState({
    customers: 0,
    transactions: 0,
    accuracy: 0,
    uptime: 0,
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();

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

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const targets = {
      customers: 500,
      transactions: 10000000,
      accuracy: 99.7,
      uptime: 99.9,
    };

    const duration = 2000; // 2 seconds
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);

      setCounts({
        customers: Math.floor(targets.customers * easeOut),
        transactions: Math.floor(targets.transactions * easeOut),
        accuracy: parseFloat((targets.accuracy * easeOut).toFixed(1)),
        uptime: parseFloat((targets.uptime * easeOut).toFixed(1)),
      });

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setCounts(targets);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isVisible]);

  const stats: Stat[] = [
    {
      icon: <Users className="w-6 h-6" />,
      value: counts.customers.toLocaleString(),
      label: "Companies Trust Us",
      suffix: "+",
      color: "from-blue-500 to-indigo-600",
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      value: counts.transactions.toLocaleString(),
      label: "Transactions Reconciled",
      suffix: "+",
      color: "from-green-500 to-emerald-600",
    },
    {
      icon: <Zap className="w-6 h-6" />,
      value: counts.accuracy.toFixed(1),
      label: "Accuracy Rate",
      suffix: "%",
      color: "from-purple-500 to-pink-600",
    },
    {
      icon: <CheckCircle2 className="w-6 h-6" />,
      value: counts.uptime.toFixed(1),
      label: "Uptime SLA",
      suffix: "%",
      color: "from-amber-500 to-orange-600",
    },
  ];

  const prefersReducedMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <div
      ref={containerRef}
      className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900"
      role="region"
      aria-label="Social proof statistics"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-slate-900 dark:text-white">
            Join Companies Automating Reconciliation
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            See why hundreds of companies trust Settler to process millions of transactions with 99.7% accuracy
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={cn(
                "bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm",
                "transition-all duration-500 hover:shadow-lg hover:scale-105",
                "text-center",
                isVisible
                  ? "opacity-100 translate-y-0 scale-100"
                  : "opacity-0 translate-y-4 scale-95"
              )}
              style={{
                transitionDelay: prefersReducedMotion ? "0ms" : `${index * 100}ms`,
              }}
              role="listitem"
            >
              <div
                className={cn(
                  "w-12 h-12 rounded-lg bg-gradient-to-br mx-auto mb-4 flex items-center justify-center text-white",
                  stat.color
                )}
              >
                {stat.icon}
              </div>
              <div className="mb-2">
                <span className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
                  {stat.value}
                </span>
                {stat.suffix && (
                  <span className="text-xl text-slate-600 dark:text-slate-400 ml-1">
                    {stat.suffix}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Trust Note */}
        <div className="mt-12 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            <span className="font-semibold text-slate-900 dark:text-white">30-day free trial</span>{" "}
            • No credit card required • Cancel anytime
          </p>
        </div>
      </div>
    </div>
  );
}
