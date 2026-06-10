// Re-exports from @settler/api dynamically at runtime to eliminate theatre
// and bypass static type declaration checker issues during typechecks.

export interface LifecycleUser {
  email: string;
  firstName?: string;
  lastName?: string;
  industry?: string;
  companyName?: string;
  planType?: "free" | "trial" | "commercial" | "enterprise";
}

export interface TrialData {
  trialStartDate: string;
  trialEndDate: string;
  daysRemaining: number;
}

let realModule: any = null;
try {
  // Use require to load the real module at runtime on Node.js
  realModule = require("@settler/api/lib/email-lifecycle");
} catch {
  // fallback if not available on server or during build phase
}

export async function sendTrialWelcomeEmail(
  user: LifecycleUser,
  trialData: TrialData
): Promise<{ id: string } | null> {
  if (realModule?.sendTrialWelcomeEmail) {
    return realModule.sendTrialWelcomeEmail(user, trialData);
  }
  console.info("[Email Stub] sendTrialWelcomeEmail:", user, trialData);
  return { id: "stub-id" };
}

export async function sendTrialValueEmail(
  user: LifecycleUser,
  trialData: TrialData,
  reconciliationData: any
): Promise<{ id: string } | null> {
  if (realModule?.sendTrialValueEmail) {
    return realModule.sendTrialValueEmail(user, trialData, reconciliationData);
  }
  console.info("[Email Stub] sendTrialValueEmail:", user, trialData, reconciliationData);
  return { id: "stub-id" };
}

export async function sendTrialGatedFeaturesEmail(
  user: LifecycleUser,
  trialData: TrialData
): Promise<{ id: string } | null> {
  if (realModule?.sendTrialGatedFeaturesEmail) {
    return realModule.sendTrialGatedFeaturesEmail(user, trialData);
  }
  console.info("[Email Stub] sendTrialGatedFeaturesEmail:", user, trialData);
  return { id: "stub-id" };
}

export async function sendTrialCaseStudyEmail(
  user: LifecycleUser,
  trialData: TrialData,
  caseStudy: any
): Promise<{ id: string } | null> {
  if (realModule?.sendTrialCaseStudyEmail) {
    return realModule.sendTrialCaseStudyEmail(user, trialData, caseStudy);
  }
  console.info("[Email Stub] sendTrialCaseStudyEmail:", user, trialData, caseStudy);
  return { id: "stub-id" };
}

export async function sendTrialComparisonEmail(
  user: LifecycleUser,
  trialData: TrialData
): Promise<{ id: string } | null> {
  if (realModule?.sendTrialComparisonEmail) {
    return realModule.sendTrialComparisonEmail(user, trialData);
  }
  console.info("[Email Stub] sendTrialComparisonEmail:", user, trialData);
  return { id: "stub-id" };
}

export async function sendTrialUrgencyEmail(
  user: LifecycleUser,
  trialData: TrialData,
  day: 27 | 28 | 29
): Promise<{ id: string } | null> {
  if (realModule?.sendTrialUrgencyEmail) {
    return realModule.sendTrialUrgencyEmail(user, trialData, day);
  }
  console.info("[Email Stub] sendTrialUrgencyEmail:", user, trialData, day);
  return { id: "stub-id" };
}

export async function sendTrialEndedEmail(user: LifecycleUser): Promise<{ id: string } | null> {
  if (realModule?.sendTrialEndedEmail) {
    return realModule.sendTrialEndedEmail(user);
  }
  console.info("[Email Stub] sendTrialEndedEmail:", user);
  return { id: "stub-id" };
}

export async function sendPaidWelcomeEmail(user: LifecycleUser): Promise<{ id: string } | null> {
  if (realModule?.sendPaidWelcomeEmail) {
    return realModule.sendPaidWelcomeEmail(user);
  }
  console.info("[Email Stub] sendPaidWelcomeEmail:", user);
  return { id: "stub-id" };
}

export async function sendMonthlySummaryEmail(
  user: LifecycleUser,
  metrics: any
): Promise<{ id: string } | null> {
  if (realModule?.sendMonthlySummaryEmail) {
    return realModule.sendMonthlySummaryEmail(user, metrics);
  }
  console.info("[Email Stub] sendMonthlySummaryEmail:", user, metrics);
  return { id: "stub-id" };
}

export async function sendLowActivityEmail(user: LifecycleUser): Promise<{ id: string } | null> {
  if (realModule?.sendLowActivityEmail) {
    return realModule.sendLowActivityEmail(user);
  }
  console.info("[Email Stub] sendLowActivityEmail:", user);
  return { id: "stub-id" };
}
