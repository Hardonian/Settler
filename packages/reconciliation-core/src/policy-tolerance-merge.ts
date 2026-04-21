/**
 * Deterministic merge of adjudication policy hints into matching tolerances.
 * Bounded so operator memory cannot explode match rates without limit.
 */

export type ToleranceMergeInput = {
  amountTolerance: number;
  dateToleranceDays: number;
};

export type ToleranceMergeResult = ToleranceMergeInput & {
  appliedReasonCodes: string[];
};

const MAX_AMOUNT = 5.0;
const MAX_DATE_DAYS = 30;

/**
 * Applies {@link PolicyEngine} weight hints to base tolerances from matching config.
 */
export function applyPolicyHintsToTolerances(
  base: ToleranceMergeInput,
  policyWeightHints: Readonly<Record<string, number>>
): ToleranceMergeResult {
  let amountTolerance = base.amountTolerance;
  let dateToleranceDays = base.dateToleranceDays;
  const appliedReasonCodes: string[] = [];

  const dup = policyWeightHints.match_duplicate_tolerance ?? 0;
  if (dup > 0) {
    const bump = Math.min(dup * 0.005, 0.05);
    amountTolerance = Math.min(amountTolerance + bump, MAX_AMOUNT);
    appliedReasonCodes.push("POLICY_MERGE_AMOUNT_DUPLICATE_ADJ");
  }

  const timing = policyWeightHints.tolerance_date ?? 0;
  if (timing > 0) {
    const extra = Math.min(Math.round(timing), 5);
    dateToleranceDays = Math.min(dateToleranceDays + extra, MAX_DATE_DAYS);
    appliedReasonCodes.push("POLICY_MERGE_DATE_TIMING_ADJ");
  }

  const amt = policyWeightHints.tolerance_amount ?? 0;
  if (amt > 0) {
    const bump = Math.min(amt * 0.01, 0.08);
    amountTolerance = Math.min(amountTolerance + bump, MAX_AMOUNT);
    appliedReasonCodes.push("POLICY_MERGE_AMOUNT_FX_FEE_ADJ");
  }

  return {
    amountTolerance: Number(amountTolerance.toFixed(6)),
    dateToleranceDays,
    appliedReasonCodes: [...new Set(appliedReasonCodes)].sort(),
  };
}
