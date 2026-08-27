import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy");

const fromEmail = process.env.RESEND_FROM_EMAIL || "notifications@settler.dev";
const fromName = process.env.RESEND_FROM_NAME || "Settler";

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

const sendEmail = async (to: string, subject: string, html: string) => {
  if (!process.env.RESEND_API_KEY) {
    console.info(
      "[Email Lifecycle] Simulation mode (No API key). Email to:",
      to,
      "Subject:",
      subject
    );
    return { id: `simulated-${Date.now()}` };
  }
  try {
    const data = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to,
      subject,
      html,
    });
    return data;
  } catch (error) {
    console.error("[Email Lifecycle] Error sending email:", error);
    return null;
  }
};

export async function sendTrialWelcomeEmail(user: LifecycleUser, trialData: TrialData) {
  const html = `
    <h1>Welcome to Settler, ${user.firstName || "there"}!</h1>
    <p>Your trial starts on ${trialData.trialStartDate} and ends on ${trialData.trialEndDate}. You have ${trialData.daysRemaining} days remaining.</p>
    <p>We're excited to have you on board!</p>
  `;
  return sendEmail(user.email, "Welcome to your Settler Trial!", html);
}

export async function sendTrialValueEmail(
  user: LifecycleUser,
  _trialData: TrialData,
  _reconciliationData: any
) {
  const html = `
    <h1>Hi ${user.firstName || "there"}, see the value of Settler!</h1>
    <p>We noticed you've been reconciling data. Did you know you can automate this?</p>
  `;
  return sendEmail(user.email, "Get the most out of your Settler Trial", html);
}

export async function sendTrialGatedFeaturesEmail(user: LifecycleUser, _trialData: TrialData) {
  const html = `
    <h1>Unlock Premium Features</h1>
    <p>Upgrade to access advanced reconciliation features!</p>
  `;
  return sendEmail(user.email, "Unlock Premium Features on Settler", html);
}

export async function sendTrialCaseStudyEmail(
  user: LifecycleUser,
  _trialData: TrialData,
  _caseStudy: any
) {
  const html = `
    <h1>See how others succeed with Settler</h1>
    <p>Read our latest case study.</p>
  `;
  return sendEmail(user.email, "Customer Success with Settler", html);
}

export async function sendTrialComparisonEmail(user: LifecycleUser, _trialData: TrialData) {
  const html = `
    <h1>Settler vs Spreadsheets</h1>
    <p>Why automated reconciliation wins every time.</p>
  `;
  return sendEmail(user.email, "Why choose Settler?", html);
}

export async function sendTrialUrgencyEmail(
  user: LifecycleUser,
  trialData: TrialData,
  _day: 27 | 28 | 29
) {
  const html = `
    <h1>Your trial is ending soon!</h1>
    <p>You only have ${trialData.daysRemaining} days left.</p>
  `;
  return sendEmail(user.email, "Action Required: Your Settler Trial is Ending", html);
}

export async function sendTrialEndedEmail(user: LifecycleUser) {
  const html = `
    <h1>Your trial has ended</h1>
    <p>Upgrade now to keep your data.</p>
  `;
  return sendEmail(user.email, "Your Settler Trial has ended", html);
}

export async function sendPaidWelcomeEmail(user: LifecycleUser) {
  const html = `
    <h1>Welcome to Settler Premium!</h1>
    <p>Thank you for upgrading.</p>
  `;
  return sendEmail(user.email, "Welcome to Settler Premium", html);
}

export async function sendMonthlySummaryEmail(user: LifecycleUser, _metrics: any) {
  const html = `
    <h1>Your Monthly Summary</h1>
    <p>Here is your reconciliation summary for the month.</p>
  `;
  return sendEmail(user.email, "Your Settler Monthly Summary", html);
}

export async function sendLowActivityEmail(user: LifecycleUser) {
  const html = `
    <h1>We miss you!</h1>
    <p>Log in to see what's new.</p>
  `;
  return sendEmail(user.email, "We haven't seen you lately", html);
}
