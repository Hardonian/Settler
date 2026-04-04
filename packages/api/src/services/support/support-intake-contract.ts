/**
 * Re-export canonical support intake contract from @settler/types.
 * API services should import from here or from @settler/types directly.
 */
export {
  SUPPORT_ISSUE_CATEGORY,
  SUPPORT_ISSUE_CATEGORY_LABELS,
  SUPPORT_STATUS,
  SUPPORT_STATUS_LABELS,
  SUPPORT_SEVERITY,
  SUPPORT_SEVERITY_LABELS,
  supportIntakeSubmissionSchema,
  type SupportIntakeSubmission,
  type SupportIssueCategory,
  type SupportStatus,
  type SupportSeverity,
  type SupportSubmissionRecord,
} from "@settler/types";
