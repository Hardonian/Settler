/**
 * RuleSet
 * Defines a collection of reconciliation rules
 */
import { ReactNode } from "react";
export interface RuleSetProps {
    id: string;
    name: string;
    priority?: "exact-first" | "fuzzy-first" | "custom";
    conflictResolution?: "first-wins" | "last-wins" | "manual-review";
    children: ReactNode;
}
export declare function RuleSet({ id, name, priority, conflictResolution, children, }: RuleSetProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=RuleSet.d.ts.map