/**
 * Premium Email Templates for Edge Function
 * Settler-branded, polished email templates
 */

export interface EmailTemplateVariables {
  name?: string;
  dashboardUrl?: string;
  upgradeUrl?: string;
  freeTierUrl?: string;
  trialEndDate?: string;
  daysRemaining?: string;
  reconciliations?: string;
  completionPercentage?: string;
  nextStep?: string;
  hasCompletedFirstJob?: string;
  [key: string]: string | undefined;
}

function getBaseTemplate(content: string, variables: EmailTemplateVariables = {}): string {
  const frontendUrl = variables.dashboardUrl?.split("/console")[0] || "https://settler.dev";
  const year = new Date().getFullYear();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Settler</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f9fafb;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 32px 32px 24px; background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">Settler</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 32px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                © ${year} Settler. All rights reserved.<br>
                <a href="${frontendUrl}/legal/unsubscribe" style="color: #6b7280;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export function getWelcomeEmailTemplate(variables: EmailTemplateVariables): string {
  const name = variables.name || "there";
  const dashboardUrl = variables.dashboardUrl || "https://settler.dev/console";
  const trialEndDate = variables.trialEndDate || "14 days from now";

  const content = `
    <h2 style="margin: 0 0 16px; color: #111827; font-size: 24px; font-weight: 700;">
      Welcome to Settler, ${name}! 🎉
    </h2>
    <p style="margin: 0 0 16px; color: #374151; font-size: 16px; line-height: 1.6;">
      Thanks for signing up! You now have a <strong>14-day free trial</strong> with full access to all features—no credit card required.
    </p>
    <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 16px; margin: 24px 0; border-radius: 4px;">
      <p style="margin: 0 0 8px; color: #1e40af; font-size: 14px; font-weight: 600;">Your trial includes:</p>
      <ul style="margin: 8px 0 0; padding-left: 20px; color: #1e40af; font-size: 14px; line-height: 1.8;">
        <li>Unlimited reconciliations</li>
        <li>Unlimited receipt parsing</li>
        <li>All platform integrations</li>
        <li>Priority email support</li>
      </ul>
    </div>
    <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
      Your trial ends on <strong>${trialEndDate}</strong>.
    </p>
    <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 32px 0;">
      <tr>
        <td align="center">
          <a href="${dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 600; font-size: 16px;">
            Go to Console →
          </a>
        </td>
      </tr>
    </table>
    <p style="margin: 24px 0 0; color: #6b7280; font-size: 14px;">
      Questions? Just reply to this email—we're here to help.<br><br>
      Best,<br><strong>The Settler Team</strong>
    </p>
  `;

  return getBaseTemplate(content, variables);
}

export function getDay1OnboardingEmailTemplate(variables: EmailTemplateVariables): string {
  const name = variables.name || "there";
  const dashboardUrl = variables.dashboardUrl || "https://settler.dev/console";
  const nextStep = variables.nextStep || "Create your first API key";
  const completionPercentage = variables.completionPercentage || "0";

  const content = `
    <h2 style="margin: 0 0 16px; color: #111827; font-size: 24px; font-weight: 700;">
      Let's get you started, ${name}
    </h2>
    <p style="margin: 0 0 16px; color: #374151; font-size: 16px; line-height: 1.6;">
      You're <strong>${completionPercentage}%</strong> through onboarding. Your next step is: <strong>${nextStep}</strong>
    </p>
    <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 32px 0;">
      <tr>
        <td align="center">
          <a href="${dashboardUrl}/playground" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 600; font-size: 16px;">
            Continue Setup →
          </a>
        </td>
      </tr>
    </table>
    <p style="margin: 24px 0 0; color: #6b7280; font-size: 14px;">
      Best,<br><strong>The Settler Team</strong>
    </p>
  `;

  return getBaseTemplate(content, variables);
}

export function getDay3ActivationEmailTemplate(variables: EmailTemplateVariables): string {
  const name = variables.name || "there";
  const dashboardUrl = variables.dashboardUrl || "https://settler.dev/console";
  const hasCompletedFirstJob = variables.hasCompletedFirstJob === "true";

  const content = hasCompletedFirstJob
    ? `
    <h2 style="margin: 0 0 16px; color: #111827; font-size: 24px; font-weight: 700;">
      You're making great progress! 🎉
    </h2>
    <p style="margin: 0 0 16px; color: #374151; font-size: 16px; line-height: 1.6;">
      Hi ${name},<br><br>
      You've completed your first reconciliation job! That's a huge step forward.
    </p>
    <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 32px 0;">
      <tr>
        <td align="center">
          <a href="${dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 600; font-size: 16px;">
            Go to Dashboard →
          </a>
        </td>
      </tr>
    </table>
    <p style="margin: 24px 0 0; color: #6b7280; font-size: 14px;">
      Best,<br><strong>The Settler Team</strong>
    </p>
  `
    : `
    <h2 style="margin: 0 0 16px; color: #111827; font-size: 24px; font-weight: 700;">
      Complete your setup to unlock full value
    </h2>
    <p style="margin: 0 0 16px; color: #374151; font-size: 16px; line-height: 1.6;">
      Hi ${name},<br><br>
      You're almost there! Complete your setup to unlock the full power of Settler.
    </p>
    <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 32px 0;">
      <tr>
        <td align="center">
          <a href="${dashboardUrl}/playground" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 600; font-size: 16px;">
            Complete Setup →
          </a>
        </td>
      </tr>
    </table>
    <p style="margin: 24px 0 0; color: #6b7280; font-size: 14px;">
      Best,<br><strong>The Settler Team</strong>
    </p>
  `;

  return getBaseTemplate(content, variables);
}

export function getTrialExpirationWarningTemplate(variables: EmailTemplateVariables): string {
  const name = variables.name || "there";
  const upgradeUrl = variables.upgradeUrl || "https://settler.dev/pricing";
  const daysRemaining = variables.daysRemaining || "3";
  const reconciliations = variables.reconciliations || "0";

  const content = `
    <h2 style="margin: 0 0 16px; color: #111827; font-size: 24px; font-weight: 700;">
      ⏰ Your trial ends in ${daysRemaining} day${daysRemaining !== "1" ? "s" : ""}
    </h2>
    <p style="margin: 0 0 16px; color: #374151; font-size: 16px; line-height: 1.6;">
      Hi ${name},<br><br>
      <strong>Your trial ends in ${daysRemaining} day${daysRemaining !== "1" ? "s" : ""}!</strong><br><br>
      You've run <strong>${reconciliations} reconciliation${reconciliations !== "1" ? "s" : ""}</strong> so far. Don't lose access to your workflows.
    </p>
    <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 32px 0;">
      <tr>
        <td align="center">
          <a href="${upgradeUrl}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 600; font-size: 16px;">
            Upgrade to Commercial - $99/mo →
          </a>
        </td>
      </tr>
    </table>
    <p style="margin: 24px 0 0; color: #6b7280; font-size: 14px;">
      Best,<br><strong>The Settler Team</strong>
    </p>
  `;

  return getBaseTemplate(content, variables);
}

export function getPlainTextVersion(html: string): string {
  return html
    .replace(/<style[^>]*>.*?<\/style>/gis, "")
    .replace(/<script[^>]*>.*?<\/script>/gis, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
