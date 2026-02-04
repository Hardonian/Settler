"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface AnimatedHeroProps {
  badge?: string;
  title: string | ReactNode;
  description: string;
  className?: string;
}

/**
 * OPTIMIZED Animated hero section component
 * - Uses CSS transitions instead of JS state when possible
 * - Respects prefers-reduced-motion immediately (no flash)
 * - Faster hydration with progressive enhancement
 */
export function AnimatedHero({ badge, title, description, className = "" }: AnimatedHeroProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check motion preference immediately to avoid animation flash
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    // If no reduced motion, trigger animation on next tick for smooth entry
    if (!mediaQuery.matches) {
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    } else {
      setIsVisible(true);
    }

    // Listen for changes
    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // Base classes that work for both SSR and client
  const baseClasses = "transition-all duration-300 ease-out";
  const animationClasses =
    prefersReducedMotion || isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4";

  return (
    <section
      className={`relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden ${className}`}
      aria-labelledby="hero-heading"
    >
      {/* Static background - no animation cost */}
      <div
        className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-800 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10"
        aria-hidden="true"
      />
      <div className="max-w-7xl mx-auto text-center">
        {badge && (
          <Badge
            className={cn(
              "mb-6 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border-blue-200 dark:border-blue-800",
              baseClasses,
              animationClasses
            )}
            aria-label="Page category badge"
            style={{ transitionDelay: prefersReducedMotion ? "0ms" : "50ms" }}
          >
            {badge}
          </Badge>
        )}
        <h1
          id="hero-heading"
          className={cn(
            "text-5xl md:text-7xl font-bold mb-6",
            "bg-gradient-to-r from-primary-600 via-electric-indigo to-electric-purple",
            "bg-clip-text text-transparent",
            baseClasses,
            animationClasses
          )}
          style={{ transitionDelay: prefersReducedMotion ? "0ms" : "100ms" }}
        >
          {title}
        </h1>
        <p
          className={cn(
            "text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto",
            baseClasses,
            animationClasses
          )}
          style={{ transitionDelay: prefersReducedMotion ? "0ms" : "150ms" }}
        >
          {description}
        </p>
      </div>
    </section>
  );
}
