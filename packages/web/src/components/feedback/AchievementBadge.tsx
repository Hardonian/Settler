/**
 * AchievementBadge
 *
 * Tasteful achievement/milestone unlock notification.
 * Subtle celebration animation, auto-dismisses.
 */

"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { scaleBounce, fadeUp } from "@/lib/motion/variants";
import { getReducedMotionDuration } from "@/lib/motion/tokens";

export interface AchievementBadgeProps {
  /**
   * Whether badge is visible
   */
  open: boolean;

  /**
   * Achievement title
   */
  title: string;

  /**
   * Achievement description
   */
  description?: string;

  /**
   * Icon variant
   * @default "trophy"
   */
  icon?: "trophy" | "sparkles";

  /**
   * Callback when badge is dismissed
   */
  onDismiss: () => void;

  /**
   * Auto-dismiss delay in milliseconds
   * @default 5000
   */
  autoDismissDelay?: number;

  /**
   * Custom className
   */
  className?: string;
}

export function AchievementBadge({
  open,
  title,
  description,
  icon = "trophy",
  onDismiss,
  autoDismissDelay = 5000,
  className,
}: AchievementBadgeProps) {
  React.useEffect(() => {
    if (open && autoDismissDelay > 0) {
      const timer = setTimeout(() => {
        onDismiss();
      }, autoDismissDelay);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [open, autoDismissDelay, onDismiss]);

  const IconComponent = icon === "trophy" ? Trophy : Sparkles;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={cn(
            "fixed top-4 right-4 z-50",
            "bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20",
            "border border-yellow-200 dark:border-yellow-800",
            "rounded-lg shadow-lg",
            "p-4 max-w-sm",
            "flex items-start gap-3",
            className
          )}
          role="alert"
          aria-live="polite"
        >
          <motion.div
            variants={scaleBounce}
            initial="hidden"
            animate="visible"
            transition={{
              delay: getReducedMotionDuration(0.1),
            }}
          >
            <IconComponent className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
          </motion.div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-200">{title}</p>
            {description && (
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">{description}</p>
            )}
          </div>
          <button
            onClick={onDismiss}
            className="flex-shrink-0 text-yellow-400 hover:text-yellow-600 dark:hover:text-yellow-300 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
