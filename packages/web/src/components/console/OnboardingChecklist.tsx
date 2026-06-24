"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Circle, ChevronUp, ChevronDown, ListTodo, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface ChecklistStep {
  id: string;
  title: string;
  description: string;
  href: string;
  completed: boolean;
}

const DEFAULT_STEPS: ChecklistStep[] = [
  {
    id: "step_connect",
    title: "Connect a data source",
    description: "Link your internal ledger or bank feed.",
    href: "/console/control-plane",
    completed: false,
  },
  {
    id: "step_run",
    title: "Run first reconciliation",
    description: "Process your initial data batch.",
    href: "/console/runs",
    completed: false,
  },
  {
    id: "step_exception",
    title: "Review an exception",
    description: "Make a decision on a mismatched record.",
    href: "/console/exceptions",
    completed: false,
  },
  {
    id: "step_proofpack",
    title: "Export a proofpack",
    description: "Generate cryptographically verifiable evidence.",
    href: "/console/audits",
    completed: false,
  },
];

export function OnboardingChecklist() {
  const [steps, setSteps] = useState<ChecklistStep[]>(DEFAULT_STEPS);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem("settler_onboarding_state");
    if (saved) {
      try {
        setSteps(JSON.parse(saved));
      } catch (err) {
        console.debug("Using default checklist steps", err);
      }
    }
  }, []);

  // Sync to local storage
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("settler_onboarding_state", JSON.stringify(steps));
    }
  }, [steps, isMounted]);

  // Provide a global way to mark steps as completed (e.g. from other pages)
  useEffect(() => {
    const handleStepComplete = (e: CustomEvent<{ stepId: string }>) => {
      setSteps((current) =>
        current.map((s) => (s.id === e.detail.stepId ? { ...s, completed: true } : s))
      );
    };

    window.addEventListener("settler_step_complete", handleStepComplete as EventListener);
    return () => {
      window.removeEventListener("settler_step_complete", handleStepComplete as EventListener);
    };
  }, []);

  if (!isMounted) return null;

  const completedCount = steps.filter((s) => s.completed).length;
  const progressPercent = (completedCount / steps.length) * 100;
  const allCompleted = completedCount === steps.length;

  if (allCompleted) {
    return null; // Hide when fully completed
  }

  return (
    <div className="bg-card/50 rounded-xl border border-border/40 overflow-hidden shadow-sm">
      <div
        className="p-3 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2.5">
          <div className="bg-primary/10 p-1.5 rounded-md">
            <ListTodo className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h4 className="text-xs font-semibold">Getting Started</h4>
            <div className="flex items-center gap-2 mt-1">
              <Progress value={progressPercent} className="h-1.5 w-16" />
              <span className="text-[10px] text-muted-foreground font-medium">
                {completedCount}/{steps.length}
              </span>
            </div>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-border/40 bg-muted/10"
          >
            <div className="p-3 space-y-1">
              {steps.map((step) => {
                const Icon = step.completed ? CheckCircle2 : Circle;
                return (
                  <Link
                    key={step.id}
                    href={step.href}
                    className={cn(
                      "flex items-start gap-2.5 p-2 rounded-lg transition-colors group",
                      step.completed
                        ? "opacity-60 grayscale hover:grayscale-0 hover:opacity-100 hover:bg-muted/50"
                        : "hover:bg-muted/50"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 mt-0.5 flex-shrink-0 transition-colors",
                        step.completed
                          ? "text-primary"
                          : "text-muted-foreground group-hover:text-foreground"
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "text-xs font-medium truncate",
                          step.completed && "line-through text-muted-foreground"
                        )}
                      >
                        {step.title}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                        {step.description}
                      </p>
                    </div>
                    {!step.completed && (
                      <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all mt-1" />
                    )}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
