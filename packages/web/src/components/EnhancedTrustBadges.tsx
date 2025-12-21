"use client";

import { useEffect, useRef, useState } from "react";
import { SafeImage } from "@/components/SafeImage";
import { cn } from "@/lib/utils";

interface Badge {
  name: string;
  icon: string;
  status: "active" | "in-progress";
  note?: string;
  description?: string;
  gradient: string;
}

export function EnhancedTrustBadges() {
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

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  const badges: Badge[] = [
    {
      name: "SOC 2 Type II",
      icon: "/assets/icons/soc2-badge.svg",
      status: "in-progress",
      note: "Q2 2026",
      description: "Enterprise-grade security certification",
      gradient: "from-blue-500 to-blue-600",
    },
    {
      name: "GDPR Compliant",
      icon: "/assets/icons/gdpr-badge.svg",
      status: "active",
      description: "EU data protection standards",
      gradient: "from-green-500 to-green-600",
    },
    {
      name: "AES-256 Encryption",
      icon: "/assets/icons/encryption-badge.svg",
      status: "active",
      description: "Bank-level data protection",
      gradient: "from-purple-500 to-purple-600",
    },
    {
      name: "99.9% Uptime SLA",
      icon: "/assets/icons/uptime-badge.svg",
      status: "active",
      description: "SLA-backed availability (Enterprise)",
      gradient: "from-amber-500 to-amber-600",
    },
    {
      name: "30-Day Guarantee",
      icon: "/assets/icons/money-back-badge.svg",
      status: "active",
      description: "Money-back guarantee",
      gradient: "from-emerald-500 to-emerald-600",
    },
    {
      name: "PCI-DSS Compliant",
      icon: "/assets/icons/payment-secure-badge.svg",
      status: "active",
      description: "Secure payment processing",
      gradient: "from-indigo-500 to-indigo-600",
    },
  ];

  const prefersReducedMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <div
      ref={containerRef}
      className="flex flex-wrap items-center justify-center gap-6 py-8"
      role="list"
      aria-label="Trust badges and certifications"
    >
      {badges.map((badge, index) => (
        <div
          key={index}
          className={cn(
            "group relative flex flex-col items-center gap-3 px-6 py-4",
            "bg-white dark:bg-slate-800 rounded-xl border-2 border-slate-200 dark:border-slate-700",
            "shadow-sm transition-all duration-500",
            "hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600",
            "hover:scale-105",
            isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-95"
          )}
          style={{
            transitionDelay: prefersReducedMotion ? "0ms" : `${index * 100}ms`,
          }}
          role="listitem"
          aria-label={badge.name}
        >
          <div className="relative w-16 h-16 flex items-center justify-center">
            <SafeImage
              src={badge.icon}
              alt={`${badge.name} certification badge`}
              width={64}
              height={64}
              className="object-contain"
              fallbackTitle={badge.name}
              fallbackCaption={badge.description}
              unoptimized
              sizes="64px"
            />
            {badge.status === "active" && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-slate-800" />
            )}
          </div>
          <div className="text-center">
            <div className="flex items-center gap-2 justify-center mb-1">
              <span className="text-sm font-semibold text-slate-900 dark:text-white">
                {badge.name}
              </span>
              {badge.status === "active" && (
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              )}
            </div>
            {badge.description && (
              <p className="text-xs text-slate-600 dark:text-slate-400">{badge.description}</p>
            )}
            {badge.status === "in-progress" && badge.note && (
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1">
                {badge.note}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
