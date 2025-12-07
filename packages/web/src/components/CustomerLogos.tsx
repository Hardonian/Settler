"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function CustomerLogos() {
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

  // Customer logos - using text-based representation until real logos are available
  // In production, replace with actual customer logo images
  const logos: Array<{ name: string; logo?: string }> = [];

  // Temporarily hide customer logos section until real logos are available
  // This prevents credibility issues from placeholder content
  if (logos.length === 0) {
    return null;
  }

  const prefersReducedMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <div ref={containerRef} className="py-12" role="region" aria-label="Customer logos">
      <p className="text-center text-sm text-muted-foreground mb-8">Trusted by leading companies</p>
      <div
        className="flex flex-wrap items-center justify-center gap-8"
        role="list"
        aria-label="Company logos"
      >
        {logos.map((company, index) => (
          <div
            key={index}
            className={cn(
              "flex items-center justify-center w-24 h-24",
              "bg-card rounded-lg border border-border shadow-sm",
              "transition-all duration-500",
              isVisible
                ? "opacity-100 translate-y-0 scale-100"
                : "opacity-0 translate-y-4 scale-95",
              "hover:opacity-100 hover:grayscale-0 hover:scale-110 hover:shadow-lg",
              !prefersReducedMotion && "opacity-60 grayscale"
            )}
            style={{
              transitionDelay: prefersReducedMotion ? "0ms" : `${index * 100}ms`,
            }}
            role="listitem"
            aria-label={`${company.name} logo`}
            title={company.name}
          >
            <span className="text-4xl" aria-hidden="true">
              {company.logo}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
