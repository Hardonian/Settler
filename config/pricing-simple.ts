/**
 * Root re-export of web pricing-simple for scripts (`tsx scripts/...`).
 * Canonical module: `packages/web/src/config/pricing-simple.ts` (commercial spine–backed).
 */

export {
  PRICING_PLANS,
  calculateMonthlyCost,
  getPlan,
  exceedsPlanLimit,
  getPricingExplanation,
  type PricingPlan,
} from "../packages/web/src/config/pricing-simple";
