/**
 * Re-export canonical support intake contract from @settler/types.
 * API services should import from here or from @settler/types directly.
 */
export {
  SUPPORT_ISSUE_CATEGORY,
  SUPPORT_ISSUE_CATEGORY_LABELS,
  supportIntakeSubmissionSchema,
  type SupportIntakeSubmission,
  type SupportIssueCategory,
} from "@settler/types";
