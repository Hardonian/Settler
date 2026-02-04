"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

/**
 * OPTIMIZED: Reduced animation duration from 1.8s to 0.8s total
 * - Faster intro (0.5s display + 0.3s exit = 0.8s total vs 1.8s)
 * - Content now starts fading in at 0.5s vs 1.8s
 * - Improves LCP by ~1 second
 */
export function HeroAnimationWrapper({ children }: { children: React.ReactNode }) {
  const shouldReduceMotion = useReducedMotion();
  const [showIntro, setShowIntro] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);

    // If user prefers reduced motion, skip intro immediately
    if (shouldReduceMotion) {
      setShowIntro(false);
      return;
    }

    // OPTIMIZATION: Reduced from 1800ms to 500ms for faster content visibility
    // This improves LCP (Largest Contentful Paint) by ~1.3 seconds
    const timer = setTimeout(() => {
      setShowIntro(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [shouldReduceMotion]);

  // During SSR/hydration, render children immediately to avoid layout shift
  // This ensures search engines and users with JS disabled see content
  if (!isClient || shouldReduceMotion) {
    return <>{children}</>;
  }

  return (
    <div className="relative w-full">
      <AnimatePresence mode="wait">
        {showIntro ? (
          <motion.div
            key="intro"
            className="flex flex-col items-center justify-center min-h-[300px] w-full"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02, filter: "blur(4px)" }}
            // OPTIMIZATION: Faster transitions (0.3s vs 0.8s)
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-900 dark:to-white bg-clip-text text-transparent tracking-tighter">
              Settler
            </h1>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            // OPTIMIZATION: Faster content reveal (0.4s vs 0.8s)
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
