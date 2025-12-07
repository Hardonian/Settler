"use client";

import { useEffect, useRef, useState } from "react";

interface Badge {
  name: string;
  icon: string;
  status: "active" | "in-progress";
  note?: string;
}

export function TrustBadges() {
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
    { name: "SOC 2 Type II", icon: "🔒", status: "in-progress", note: "Q2 2026" },
    { name: "GDPR Compliant", icon: "🛡️", status: "active" },
    { name: "AES-256 Encryption", icon: "🔐", status: "active" },
    { name: "99.9% Uptime SLA", icon: "⚡", status: "active" },
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
          className={`
            flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm
            transition-all duration-500
            ${
              isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-95"
            }
            hover:shadow-lg hover:scale-105
          `}
          style={{
            transitionDelay: prefersReducedMotion ? "0ms" : `${index * 100}ms`,
          }}
          role="listitem"
          aria-label={badge.name}
        >
          <span className="text-2xl" aria-hidden="true">
            {badge.icon}
          </span>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {badge.name}
            </span>
            {badge.status === "in-progress" && badge.note && (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {badge.note}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
