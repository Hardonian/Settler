/**
 * Re-export canonical support intake contract from @settler/types.
 * Use the package entry (not a subpath) so Node16/tsconfig resolution and ts-jest
 * agree without requiring package-exports path mapping in every consumer.
 * `SUPPORT_CATEGORY_LABELS` is a legacy alias for web operator inbox routes.
 */
import {
  SUPPORT_ISSUE_CATEGORY,
  SUPPORT_ISSUE_CATEGORY_LABELS,
  supportIntakeSubmissionSchema,
  type SupportIntakeSubmission,
  type SupportIssueCategory,
} from "@settler/types";

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
