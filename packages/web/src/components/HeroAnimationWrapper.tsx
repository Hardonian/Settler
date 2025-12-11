'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

export function HeroAnimationWrapper({ children }: { children: React.ReactNode }) {
  const shouldReduceMotion = useReducedMotion();
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    // If user prefers reduced motion, skip intro immediately
    if (shouldReduceMotion) {
      setShowIntro(false);
      return;
    }

    // Show "Settler" for 1.5s, then transition
    const timer = setTimeout(() => {
      setShowIntro(false);
    }, 1800);

    return () => clearTimeout(timer);
  }, [shouldReduceMotion]);

  // Render children directly if reduced motion is on or after intro
  if (shouldReduceMotion) {
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
            exit={{ opacity: 0, scale: 1.1, filter: "blur(8px)" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-900 dark:to-white bg-clip-text text-transparent tracking-tighter">
              Settler
            </h1>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-full"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
