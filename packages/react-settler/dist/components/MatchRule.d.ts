/**
 * MatchRule
 * Defines a single reconciliation matching rule
 */
import { RuleField, RuleType } from "@settler/protocol";
export interface MatchRuleProps {
    id: string;
    name: string;
    field: RuleField;
    type: RuleType;
    tolerance?: {
        amount?: number;
        days?: number;
        percentage?: number;
        threshold?: number;
    };
    priority?: number;
    enabled?: boolean;
}
export declare function MatchRule({ id, name, field, type, tolerance, priority, enabled, }: MatchRuleProps): import("react/jsx-runtime").JSX.Element | null;
//# sourceMappingURL=MatchRule.d.ts.map