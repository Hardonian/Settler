/**
 * Operator Glossary & Status Definitions
 *
 * In-app reference for reconciliation terminology, status meanings,
 * exception types, and workflow semantics. Designed to reduce support
 * burden and help operators understand what they're looking at.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConsolePageHeader } from "@/components/console/ConsolePageHeader";

export const metadata = {
  title: "Glossary & Status Definitions | Settler Console",
};

const runStatuses = [
  {
    status: "Pending",
    variant: "outline" as const,
    meaning: "The run has been created but has not started executing yet. Waiting for resources or a scheduled start time.",
    action: "No action required. The run will start automatically.",
  },
  {
    status: "Running",
    variant: "info" as const,
    meaning: "The reconciliation engine is actively comparing source and target records. Progress percentage reflects records processed so far.",
    action: "Monitor progress. You can view partial results as they arrive.",
  },
  {
    status: "Completed",
    variant: "success" as const,
    meaning: "All records have been processed. Matched, unmatched, and conflict counts are final. The run is immutable.",
    action: "Review the summary. Check exceptions if unmatched or conflict counts are elevated.",
  },
  {
    status: "Failed",
    variant: "destructive" as const,
    meaning: "The run did not complete due to an error (timeout, adapter failure, invalid configuration). Partial results may be available.",
    action: "Check the error message. Fix the root cause (e.g., credentials, adapter config) and re-run.",
  },
];

const summaryStates = [
  {
    state: "Success",
    variant: "success" as const,
    meaning: "All records matched or were resolved. No open exceptions remain. This is the ideal end state.",
  },
  {
    state: "Review Needed",
    variant: "warning" as const,
    meaning: "The run completed, but unresolved exceptions remain. An operator should review and resolve or ignore them.",
  },
  {
    state: "In Progress",
    variant: "info" as const,
    meaning: "The run is still executing. Summary numbers will update as records are processed.",
  },
  {
    state: "Failed",
    variant: "destructive" as const,
    meaning: "The run did not produce usable results. See the error details for root cause.",
  },
];

const exceptionTypes = [
  {
    type: "Amount Mismatch",
    code: "amount_mismatch",
    meaning: "The source and target records were linked, but the amounts differ beyond the configured tolerance threshold.",
    example: "Stripe charge is $100.00, bank deposit is $97.10 (difference exceeds $0.50 tolerance).",
  },
  {
    type: "Missing Counterpart",
    code: "missing_counterpart",
    meaning: "A record exists in the source system but has no matching record in the target system, or vice versa.",
    example: "Bank shows a deposit with no corresponding Stripe payout.",
  },
  {
    type: "Duplicate Detected",
    code: "duplicate_detected",
    meaning: "Two or more records in the same system appear to represent the same transaction based on amount, date, and reference similarity.",
    example: "Two charges on the same card ending 4242 within 60 seconds for the same amount.",
  },
  {
    type: "Timing Variance",
    code: "timing_variance",
    meaning: "Records match by amount and reference, but the dates differ by more than the configured settlement window.",
    example: "Processor date is March 1, bank posting date is March 5 (exceeds 3-day SLA).",
  },
  {
    type: "Field Discrepancy",
    code: "field_discrepancy",
    meaning: "Records match on key fields but have mismatches in secondary fields like merchant name, currency code, or reference format.",
    example: "Source merchant name 'ACME INC' doesn't match target 'Acme Inc.'",
  },
  {
    type: "Threshold Breach",
    code: "threshold_breach",
    meaning: "A run-level or tenant-level metric exceeded a configured alert threshold. This is a systemic signal, not a single-record issue.",
    example: "Unmatched rate of 8.3% exceeds the 5% threshold configured for this job.",
  },
  {
    type: "Currency Mismatch",
    code: "currency_mismatch",
    meaning: "Source records are in one currency, target records in another, and no FX conversion rule is configured.",
    example: "Source in USD, target in EUR without a conversion rate defined.",
  },
  {
    type: "Reference Conflict",
    code: "reference_conflict",
    meaning: "A reference ID maps to multiple potential target records, creating ambiguity the engine cannot resolve automatically.",
    example: "Reference TXN-12345 matches 3 candidate records within tolerance.",
  },
];

const exceptionStatuses = [
  {
    status: "Pending",
    variant: "outline" as const,
    meaning: "Detected by the engine but not yet reviewed by an operator. Awaiting human attention.",
    action: "Review the exception details and decide: resolve, investigate, or mark as noise.",
  },
  {
    status: "Investigating",
    variant: "info" as const,
    meaning: "An operator has acknowledged the exception and is actively investigating the root cause.",
    action: "Continue investigation. Update status when resolved or if escalation is needed.",
  },
  {
    status: "Resolved",
    variant: "success" as const,
    meaning: "The exception has been addressed. The operator confirmed the correct action and the issue is closed.",
    action: "No further action needed. The resolution is logged in the audit trail.",
  },
  {
    status: "Ignored",
    variant: "secondary" as const,
    meaning: "The operator determined this exception is noise — below materiality threshold or a known benign pattern.",
    action: "No further action needed. Consider adjusting tolerance rules if this pattern recurs.",
  },
];

const severityLevels = [
  {
    level: "Critical",
    variant: "destructive" as const,
    meaning: "Requires immediate attention. May indicate data integrity issues, significant financial discrepancies, or system-level problems.",
  },
  {
    level: "High",
    variant: "warning" as const,
    meaning: "Important but not urgent. Significant mismatches that should be resolved within the current review cycle.",
  },
  {
    level: "Medium",
    variant: "outline" as const,
    meaning: "Standard exceptions that should be reviewed during routine reconciliation review.",
  },
  {
    level: "Low",
    variant: "secondary" as const,
    meaning: "Minor discrepancies. Often timing variances or rounding differences that resolve naturally.",
  },
];

const coreTerms = [
  { term: "Run", definition: "A single execution of the reconciliation engine comparing source records against target records using configured rules." },
  { term: "Source", definition: "The primary data system (e.g., payment processor, ERP) whose records are being verified against the target." },
  { term: "Target", definition: "The counterparty data system (e.g., bank, accounting system) used to validate source records." },
  { term: "Match", definition: "A source record that was successfully paired with a target record within configured tolerance rules." },
  { term: "Tolerance", definition: "A configurable threshold (amount, date, or field) within which records are considered matching despite minor differences." },
  { term: "Exception", definition: "A detected discrepancy that requires operator review — could be a mismatch, missing record, duplicate, or threshold breach." },
  { term: "Adapter", definition: "A connector that pulls data from an external system (Stripe, Shopify, QuickBooks, bank APIs) into Settler's reconciliation engine." },
  { term: "Tenant", definition: "An isolated workspace containing its own data, users, rules, and reconciliation history. No data crosses tenant boundaries." },
  { term: "Provenance", definition: "The complete lineage of a reconciliation result — which inputs were used, what rules were applied, and what engine version produced the output." },
  { term: "Evidence Manifest", definition: "A hash-linked artifact produced by each run that can be independently verified. Contains input hashes, rule versions, and output checksums." },
  { term: "Config Drift", definition: "A detection signal indicating that the job configuration changed between the current run and the previous run, which may affect result comparability." },
  { term: "Replay", definition: "Re-executing a run with identical inputs and rules to verify that the same output is produced. Proves determinism." },
];

export default function GlossaryPage() {
  return (
    <div className="space-y-8">
      <ConsolePageHeader
        title="Glossary & Status Definitions"
        description="Reference guide for reconciliation terminology, statuses, exception types, and severity levels used throughout the console."
        breadcrumbs={[
          { label: "Console", href: "/console" },
          { label: "Docs", href: "/console/docs" },
          { label: "Glossary" },
        ]}
      />

      {/* Core Terms */}
      <Card>
        <CardHeader>
          <CardTitle>Core Terms</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3">
            {coreTerms.map(({ term, definition }) => (
              <div key={term} className="grid grid-cols-[140px_1fr] gap-4 py-2 border-b border-border last:border-0">
                <dt className="text-sm font-semibold text-foreground">{term}</dt>
                <dd className="text-sm text-muted-foreground">{definition}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      {/* Run Statuses */}
      <Card>
        <CardHeader>
          <CardTitle>Run Statuses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {runStatuses.map(({ status, variant, meaning, action }) => (
              <div key={status} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                <Badge variant={variant} className="mt-0.5 flex-shrink-0 min-w-[90px] justify-center">{status}</Badge>
                <div>
                  <p className="text-sm text-foreground">{meaning}</p>
                  <p className="text-xs text-muted-foreground mt-1">Action: {action}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary States */}
      <Card>
        <CardHeader>
          <CardTitle>Run Summary States</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {summaryStates.map(({ state, variant, meaning }) => (
              <div key={state} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                <Badge variant={variant} className="mt-0.5 flex-shrink-0 min-w-[120px] justify-center">{state}</Badge>
                <p className="text-sm text-muted-foreground">{meaning}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Exception Types */}
      <Card>
        <CardHeader>
          <CardTitle>Exception Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {exceptionTypes.map(({ type, code, meaning, example }) => (
              <div key={code} className="py-3 border-b border-border last:border-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-foreground">{type}</span>
                  <code className="text-[11px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{code}</code>
                </div>
                <p className="text-sm text-muted-foreground">{meaning}</p>
                <p className="text-xs text-muted-foreground/70 mt-1 italic">Example: {example}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Exception Statuses */}
      <Card>
        <CardHeader>
          <CardTitle>Exception Statuses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {exceptionStatuses.map(({ status, variant, meaning, action }) => (
              <div key={status} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                <Badge variant={variant} className="mt-0.5 flex-shrink-0 min-w-[110px] justify-center">{status}</Badge>
                <div>
                  <p className="text-sm text-foreground">{meaning}</p>
                  <p className="text-xs text-muted-foreground mt-1">Action: {action}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Severity Levels */}
      <Card>
        <CardHeader>
          <CardTitle>Severity Levels</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {severityLevels.map(({ level, variant, meaning }) => (
              <div key={level} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                <Badge variant={variant} className="mt-0.5 flex-shrink-0 min-w-[80px] justify-center">{level}</Badge>
                <p className="text-sm text-muted-foreground">{meaning}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
