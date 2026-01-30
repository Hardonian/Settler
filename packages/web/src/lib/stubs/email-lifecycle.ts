// Stub module for email-lifecycle
// Re-exports from @settler/api for server-side use only

export type LifecycleUser = {
  id?: string;
  email: string;
  name?: string;
  firstName?: string;
  trialEndsAt?: Date;
  industry?: string;
  companyName?: string;
  planType?: "free" | "trial" | "commercial" | "enterprise";
};

export type TrialData = {
  daysLeft?: number;
  daysRemaining?: number;
  featuresUsed?: string[];
  trialStartDate?: Date | string;
  trialEndDate?: Date | string;
};

// Stub implementations that log warnings
const stubFunction = (name: string) => {
  return async (..._args: any[]) => {
    console.warn(`[STUB] ${name} called but @settler/api is not available in web build`);
    return { success: false, error: "API package not available" };
  };
};

export const sendTrialWelcomeEmail = stubFunction("sendTrialWelcomeEmail");
export const sendTrialValueEmail = stubFunction("sendTrialValueEmail");
export const sendTrialGatedFeaturesEmail = stubFunction("sendTrialGatedFeaturesEmail");
export const sendTrialCaseStudyEmail = stubFunction("sendTrialCaseStudyEmail");
export const sendTrialComparisonEmail = stubFunction("sendTrialComparisonEmail");
export const sendTrialUrgencyEmail = stubFunction("sendTrialUrgencyEmail");
export const sendTrialEndedEmail = stubFunction("sendTrialEndedEmail");
export const sendPaidWelcomeEmail = stubFunction("sendPaidWelcomeEmail");
export const sendMonthlySummaryEmail = stubFunction("sendMonthlySummaryEmail");
export const sendLowActivityEmail = stubFunction("sendLowActivityEmail");
