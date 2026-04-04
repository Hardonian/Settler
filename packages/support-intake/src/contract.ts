/**
 * Re-export canonical support intake contract from @settler/types.
 * Import the subpath (not the package barrel) so support-intake's tsc rootDir stays valid.
 * `SUPPORT_CATEGORY_LABELS` is a legacy alias for web operator inbox routes.
 */
import {
  SUPPORT_ISSUE_CATEGORY,
  SUPPORT_ISSUE_CATEGORY_LABELS,
  supportIntakeSubmissionSchema,
  type SupportIntakeSubmission,
  type SupportIssueCategory,
} from "@settler/types/support-intake-contract";

export {
  SUPPORT_ISSUE_CATEGORY,
  SUPPORT_ISSUE_CATEGORY_LABELS,
  supportIntakeSubmissionSchema,
  type SupportIntakeSubmission,
  type SupportIssueCategory,
};

/** @deprecated Prefer SUPPORT_ISSUE_CATEGORY_LABELS from @settler/types */
export const SUPPORT_CATEGORY_LABELS: Record<SupportIssueCategory, string> =
  SUPPORT_ISSUE_CATEGORY_LABELS;
