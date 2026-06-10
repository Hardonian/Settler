// Re-exports from @settler/api to eliminate theatre
export type { LifecycleUser, TrialData } from "@settler/api/lib/email-lifecycle";
export {
  sendTrialWelcomeEmail,
  sendTrialValueEmail,
  sendTrialGatedFeaturesEmail,
  sendTrialCaseStudyEmail,
  sendTrialComparisonEmail,
  sendTrialUrgencyEmail,
  sendTrialEndedEmail,
  sendPaidWelcomeEmail,
  sendMonthlySummaryEmail,
  sendLowActivityEmail,
} from "@settler/api/lib/email-lifecycle";
