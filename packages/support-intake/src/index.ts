export {
  SUPPORT_ISSUE_CATEGORY,
  SUPPORT_CATEGORY_LABELS,
  supportIntakeSubmissionSchema,
  type SupportIssueCategory,
  type SupportIntakeSubmission,
} from "./contract";

export {
  submitSupportIntake,
  emitSupportIntakeRuntimeSignal,
  SUPPORT_INTAKE_ACTION,
  SUPPORT_INTAKE_RESOURCE_TYPE,
  type StoredSupportIntake,
  type SubmitSupportIntakeHooks,
} from "./service";
