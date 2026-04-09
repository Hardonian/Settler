/**
 * Rule Definition Example
 *
 * Demonstrates defining reconciliation rules using RuleSet and MatchRule components.
 */

import React from "react";
import { ReconciliationDashboard, RuleSet, MatchRule } from "@settler/react-settler";

export function RuleDefinition() {
  return (
    <ReconciliationDashboard>
      <RuleSet
        id="primary-rules"
        name="Primary Matching Rules"
        priority="exact-first"
        conflictResolution="manual-review"
      >
        <MatchRule
          id="rule-exact-amount"
          name="Exact Amount Match"
          field="amount"
          type="exact"
          priority={1}
          enabled={true}
        />

        <MatchRule
          id="rule-exact-transaction-id"
          name="Exact Transaction ID Match"
          field="transactionId"
          type="exact"
          priority={2}
          enabled={true}
        />

        <MatchRule
          id="rule-date-range"
          name="Date Range Match (7 days)"
          field="date"
          type="range"
          tolerance={{ days: 7 }}
          priority={3}
          enabled={true}
        />

        <MatchRule
          id="rule-fuzzy-amount"
          name="Fuzzy Amount Match (1% tolerance)"
          field="amount"
          type="fuzzy"
          tolerance={{ percentage: 0.01, threshold: 0.95 }}
          priority={4}
          enabled={true}
        />
      </RuleSet>

      <RuleSet
        id="fallback-rules"
        name="Fallback Rules"
        priority="fuzzy-first"
        conflictResolution="first-wins"
      >
        <MatchRule
          id="rule-reference-id"
          name="Reference ID Match"
          field="referenceId"
          type="regex"
          priority={1}
          enabled={true}
        />
      </RuleSet>
    </ReconciliationDashboard>
  );
}
