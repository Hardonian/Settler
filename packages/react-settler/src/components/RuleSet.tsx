/**
 * RuleSet
 * Defines a collection of reconciliation rules
 */

import { ReactNode } from "react";
import { ReconciliationRuleSet } from "@settler/protocol";
import { useCompilationContext } from "../context";

export interface RuleSetProps {
  id: string;
  name: string;
  priority?: "exact-first" | "fuzzy-first" | "custom";
  conflictResolution?: "first-wins" | "last-wins" | "manual-review";
  children: ReactNode;
}

export function RuleSet({
  id,
  name,
  priority = "exact-first",
  conflictResolution = "manual-review",
  children,
}: RuleSetProps) {
  const context = useCompilationContext();

  // Extract rules from children (MatchRule components)
  // Rules are collected by MatchRule components during render

  // In config mode, collect rules and register ruleset
  if (context.mode === "config") {
    // Rules will be collected by MatchRule components
    // For now, we'll register the ruleset structure
    const ruleset: ReconciliationRuleSet = {
      id,
      name,
      rules: [], // Will be populated by MatchRule components
      priority,
      conflictResolution,
    };

    if (!context.config.rulesets) {
      context.config.rulesets = [];
    }
    context.config.rulesets.push(ruleset);
  }

  // Render children in both modes (children handle their own mode logic)
  return <>{children}</>;
}
