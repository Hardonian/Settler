"use strict";
/**
 * Premium Email Templates
 * Settler-branded, polished email templates with consistent design
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWelcomeEmailTemplate = getWelcomeEmailTemplate;
exports.getDay1OnboardingEmailTemplate = getDay1OnboardingEmailTemplate;
exports.getDay3ActivationEmailTemplate = getDay3ActivationEmailTemplate;
exports.getTrialExpirationWarningTemplate = getTrialExpirationWarningTemplate;
exports.getFinalTrialReminderTemplate = getFinalTrialReminderTemplate;
exports.getTrialEndedTemplate = getTrialEndedTemplate;
exports.getPlainTextVersion = getPlainTextVersion;
/**
 * Base email template wrapper with Settler branding
 */
function getBaseTemplate(content, variables = {}) {
    const frontendUrl = variables.dashboardUrl?.split('/console')[0] || 'https://settler.dev';
    const year = new Date().getFullYear();
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Settler</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; border-spacing: 0; background-color: #f9fafb;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px; background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); border-radius: 8px 8px 0 0;">
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td>
                    <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">
                      Settler
                    </h1>
                  </td>
                  <td align="right">
                    <img src="${frontendUrl}/logo.png" alt="Settler" width="32" height="32" style="display: block; border-radius: 4px;">
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              ${content}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding-bottom: 16px;">
                    <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 1.5;">
                      <strong style="color: #111827;">Settler</strong><br>
                      The API Infrastructure for Financial Evidence
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 16px;">
                    <p style="margin: 0; font-size: 12px; color: #9ca3af; line-height: 1.5;">
                      <a href="${frontendUrl}/docs" style="color: #2563eb; text-decoration: none;">Documentation</a> &middot;
                      <a href="${frontendUrl}/pricing" style="color: #2563eb; text-decoration: none;">Pricing</a> &middot;
                      <a href="${frontendUrl}/support" style="color: #2563eb; text-decoration: none;">Support</a>
                    </p>
                  </td>
                </tr>
                <tr>
                  <td>
                    <p style="margin: 0; font-size: 12px; color: #9ca3af; line-height: 1.5;">
                      © ${year} Settler. All rights reserved.<br>
                      <a href="${frontendUrl}/legal/unsubscribe" style="color: #6b7280; text-decoration: underline;">Unsubscribe</a> or
                      <a href="${frontendUrl}/legal/preferences" style="color: #6b7280; text-decoration: underline;">manage preferences</a>
                    </p>
                  </td>
                </tr>
              </table>
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
/**
 * Welcome email (Day 0)
 */
function getWelcomeEmailTemplate(variables) {
    const name = variables.name || 'there';
    const dashboardUrl = variables.dashboardUrl || 'https://settler.dev/console';
    const trialEndDate = variables.trialEndDate || '14 days from now';
    const content = `
    <h2 style="margin: 0 0 16px; color: #111827; font-size: 24px; font-weight: 700; line-height: 1.3;">
      Welcome to Settler, ${name}! 🎉
    </h2>
    
    <p style="margin: 0 0 16px; color: #374151; font-size: 16px; line-height: 1.6;">
      Thanks for signing up! You now have a <strong style="color: #111827;">14-day free trial</strong> with full access to all features—no credit card required.
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
      Your trial ends on <strong style="color: #111827;">${trialEndDate}</strong>. We'll send you helpful tips along the way.
    </p>
    
    <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 32px 0;">
      <tr>
        <td align="center">
          <a href="${dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.3);">
            Go to Console →
          </a>
        </td>
      </tr>
    </table>
    
    <p style="margin: 24px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
      Questions? Just reply to this email—we're here to help.<br><br>
      Best,<br>
      <strong style="color: #111827;">The Settler Team</strong>
    </p>
  `;
    return getBaseTemplate(content, variables);
}
/**
 * Day 1 onboarding email
 */
function getDay1OnboardingEmailTemplate(variables) {
    const name = variables.name || 'there';
    const dashboardUrl = variables.dashboardUrl || 'https://settler.dev/console';
    const nextStep = variables.nextStep || 'Create your first API key';
    const completionPercentage = variables.completionPercentage || '0';
    const content = `
    <h2 style="margin: 0 0 16px; color: #111827; font-size: 24px; font-weight: 700; line-height: 1.3;">
      Let's get you started, ${name}
    </h2>
    
    <p style="margin: 0 0 16px; color: #374151; font-size: 16px; line-height: 1.6;">
      You're <strong style="color: #111827;">${completionPercentage}%</strong> through onboarding. Your next step is:
    </p>
    
    <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px; margin: 24px 0; border-radius: 4px;">
      <p style="margin: 0; color: #166534; font-size: 16px; font-weight: 600;">
        ${nextStep}
      </p>
    </div>
    
    <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
      Getting started is easy and takes just a few minutes:
    </p>
    
    <ol style="margin: 0 0 24px; padding-left: 20px; color: #374151; font-size: 16px; line-height: 2;">
      <li style="margin-bottom: 12px;">Create your first API key</li>
      <li style="margin-bottom: 12px;">Run your first reconciliation</li>
      <li style="margin-bottom: 12px;">Export your results</li>
    </ol>
    
    <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 32px 0;">
      <tr>
        <td align="center">
          <a href="${dashboardUrl}/playground" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.3);">
            Continue Setup →
          </a>
        </td>
      </tr>
    </table>
    
    <p style="margin: 24px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
      Need help? Check out our <a href="https://settler.dev/docs/getting-started" style="color: #2563eb; text-decoration: none;">getting started guide</a>.<br><br>
      Best,<br>
      <strong style="color: #111827;">The Settler Team</strong>
    </p>
  `;
    return getBaseTemplate(content, variables);
}
/**
 * Day 3 activation email
 */
function getDay3ActivationEmailTemplate(variables) {
    const name = variables.name || 'there';
    const dashboardUrl = variables.dashboardUrl || 'https://settler.dev/console';
    const hasCompletedFirstJob = variables.hasCompletedFirstJob === 'true';
    const content = hasCompletedFirstJob ? `
    <h2 style="margin: 0 0 16px; color: #111827; font-size: 24px; font-weight: 700; line-height: 1.3;">
      You're making great progress! 🎉
    </h2>
    
    <p style="margin: 0 0 16px; color: #374151; font-size: 16px; line-height: 1.6;">
      Hi ${name},
    </p>
    
    <p style="margin: 0 0 16px; color: #374151; font-size: 16px; line-height: 1.6;">
      You've completed your first reconciliation job! That's a huge step forward. You're all set to start automating your financial operations.
    </p>
    
    <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px; margin: 24px 0; border-radius: 4px;">
      <p style="margin: 0; color: #166534; font-size: 14px; line-height: 1.6;">
        <strong>What's next?</strong><br>
        Set up webhooks for real-time updates, explore advanced matching rules, or export your reports.
      </p>
    </div>
    
    <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 32px 0;">
      <tr>
        <td align="center">
          <a href="${dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.3);">
            Go to Dashboard →
          </a>
        </td>
      </tr>
    </table>
    
    <p style="margin: 24px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
      Need help? Reply to this email or check out our <a href="https://settler.dev/docs" style="color: #2563eb; text-decoration: none;">documentation</a>.<br><br>
      Best,<br>
      <strong style="color: #111827;">The Settler Team</strong>
    </p>
  ` : `
    <h2 style="margin: 0 0 16px; color: #111827; font-size: 24px; font-weight: 700; line-height: 1.3;">
      Complete your setup to unlock full value
    </h2>
    
    <p style="margin: 0 0 16px; color: #374151; font-size: 16px; line-height: 1.6;">
      Hi ${name},
    </p>
    
    <p style="margin: 0 0 16px; color: #374151; font-size: 16px; line-height: 1.6;">
      You're almost there! Complete your setup to unlock the full power of Settler.
    </p>
    
    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 4px;">
      <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
        <strong>Quick setup steps:</strong><br>
        1. Create your first API key<br>
        2. Run your first reconciliation<br>
        3. Export your results
      </p>
    </div>
    
    <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 32px 0;">
      <tr>
        <td align="center">
          <a href="${dashboardUrl}/playground" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.3);">
            Complete Setup →
          </a>
        </td>
      </tr>
    </table>
    
    <p style="margin: 24px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
      Questions? Reply to this email—we're here to help.<br><br>
      Best,<br>
      <strong style="color: #111827;">The Settler Team</strong>
    </p>
  `;
    return getBaseTemplate(content, variables);
}
/**
 * Trial expiration warning (3 days)
 */
function getTrialExpirationWarningTemplate(variables) {
    const name = variables.name || 'there';
    const upgradeUrl = variables.upgradeUrl || 'https://settler.dev/pricing';
    const daysRemaining = variables.daysRemaining || '3';
    const reconciliations = variables.reconciliations || '0';
    const content = `
    <h2 style="margin: 0 0 16px; color: #111827; font-size: 24px; font-weight: 700; line-height: 1.3;">
      ⏰ Your trial ends in ${daysRemaining} day${daysRemaining !== '1' ? 's' : ''}
    </h2>
    
    <p style="margin: 0 0 16px; color: #374151; font-size: 16px; line-height: 1.6;">
      Hi ${name},
    </p>
    
    <p style="margin: 0 0 16px; color: #374151; font-size: 16px; line-height: 1.6;">
      <strong style="color: #111827;">Your trial ends in ${daysRemaining} day${daysRemaining !== '1' ? 's' : ''}!</strong>
    </p>
    
    <p style="margin: 0 0 16px; color: #374151; font-size: 16px; line-height: 1.6;">
      You've run <strong style="color: #111827;">${reconciliations} reconciliation${reconciliations !== '1' ? 's' : ''}</strong> so far. Don't lose access to your workflows.
    </p>
    
    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 4px;">
      <p style="margin: 0 0 8px; color: #92400e; font-size: 14px; font-weight: 600;">Upgrade now to keep:</p>
      <ul style="margin: 8px 0 0; padding-left: 20px; color: #92400e; font-size: 14px; line-height: 1.8;">
        <li>100,000 reconciliations/month</li>
        <li>10,000 receipt parses/month</li>
        <li>All your existing jobs and data</li>
        <li>Priority email support</li>
      </ul>
    </div>
    
    <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 32px 0;">
      <tr>
        <td align="center">
          <a href="${upgradeUrl}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(245, 158, 11, 0.3);">
            Upgrade to Commercial - $99/mo →
          </a>
        </td>
      </tr>
    </table>
    
    <p style="margin: 24px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
      Questions? Reply to this email and we'll help.<br><br>
      Best,<br>
      <strong style="color: #111827;">The Settler Team</strong>
    </p>
  `;
    return getBaseTemplate(content, variables);
}
/**
 * Final trial reminder (1 day)
 */
function getFinalTrialReminderTemplate(variables) {
    const name = variables.name || 'there';
    const upgradeUrl = variables.upgradeUrl || 'https://settler.dev/pricing';
    const reconciliations = variables.reconciliations || '0';
    const content = `
    <h2 style="margin: 0 0 16px; color: #111827; font-size: 24px; font-weight: 700; line-height: 1.3;">
      ⚠️ Last Chance: Your Trial Ends Tomorrow
    </h2>
    
    <p style="margin: 0 0 16px; color: #374151; font-size: 16px; line-height: 1.6;">
      Hi ${name},
    </p>
    
    <p style="margin: 0 0 16px; color: #374151; font-size: 16px; line-height: 1.6;">
      <strong style="color: #dc2626;">Your trial ends tomorrow!</strong>
    </p>
    
    <p style="margin: 0 0 16px; color: #374151; font-size: 16px; line-height: 1.6;">
      You've run <strong style="color: #111827;">${reconciliations} reconciliation${reconciliations !== '1' ? 's' : ''}</strong>. Upgrade now to keep everything you've built.
    </p>
    
    <div style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 16px; margin: 24px 0; border-radius: 4px;">
      <p style="margin: 0; color: #991b1b; font-size: 14px; line-height: 1.6;">
        <strong>After tomorrow, you'll be moved to the free plan with limited features.</strong><br>
        Upgrade now to maintain full access to all your workflows and data.
      </p>
    </div>
    
    <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 32px 0;">
      <tr>
        <td align="center">
          <a href="${upgradeUrl}" style="display: inline-block; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 6px; font-weight: 700; font-size: 18px; box-shadow: 0 4px 6px rgba(239, 68, 68, 0.3);">
            Upgrade Now - Only $99/mo →
          </a>
        </td>
      </tr>
    </table>
    
    <p style="margin: 24px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
      Questions? Reply to this email—we're here to help.<br><br>
      Best,<br>
      <strong style="color: #111827;">The Settler Team</strong>
    </p>
  `;
    return getBaseTemplate(content, variables);
}
/**
 * Trial ended email
 */
function getTrialEndedTemplate(variables) {
    const name = variables.name || 'there';
    const upgradeUrl = variables.upgradeUrl || 'https://settler.dev/pricing';
    const freeTierUrl = variables.freeTierUrl || 'https://settler.dev/console';
    const content = `
    <h2 style="margin: 0 0 16px; color: #111827; font-size: 24px; font-weight: 700; line-height: 1.3;">
      Your Trial Has Ended
    </h2>
    
    <p style="margin: 0 0 16px; color: #374151; font-size: 16px; line-height: 1.6;">
      Hi ${name},
    </p>
    
    <p style="margin: 0 0 16px; color: #374151; font-size: 16px; line-height: 1.6;">
      Your trial has ended. You've been moved to the free plan.
    </p>
    
    <div style="background-color: #f3f4f6; border-left: 4px solid #6b7280; padding: 16px; margin: 24px 0; border-radius: 4px;">
      <p style="margin: 0 0 8px; color: #374151; font-size: 14px; font-weight: 600;">You can still:</p>
      <ul style="margin: 8px 0 0; padding-left: 20px; color: #374151; font-size: 14px; line-height: 1.8;">
        <li>Access your existing jobs and data</li>
        <li>Run up to 1,000 reconciliations per month</li>
        <li>Use basic features</li>
      </ul>
    </div>
    
    <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 16px; margin: 24px 0; border-radius: 4px;">
      <p style="margin: 0 0 8px; color: #1e40af; font-size: 14px; font-weight: 600;">Want to upgrade? You'll get:</p>
      <ul style="margin: 8px 0 0; padding-left: 20px; color: #1e40af; font-size: 14px; line-height: 1.8;">
        <li>100,000 reconciliations/month</li>
        <li>10,000 receipt parses/month</li>
        <li>All advanced features</li>
        <li>Priority support</li>
      </ul>
    </div>
    
    <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 32px 0;">
      <tr>
        <td align="center" style="padding-bottom: 12px;">
          <a href="${upgradeUrl}" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.3);">
            Upgrade Now →
          </a>
        </td>
      </tr>
      <tr>
        <td align="center">
          <a href="${freeTierUrl}" style="display: inline-block; color: #2563eb; text-decoration: none; font-size: 14px;">
            Continue on Free Plan →
          </a>
        </td>
      </tr>
    </table>
    
    <p style="margin: 24px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
      Best,<br>
      <strong style="color: #111827;">The Settler Team</strong>
    </p>
  `;
    return getBaseTemplate(content, variables);
}
/**
 * Generate plain text version from HTML
 */
function getPlainTextVersion(html) {
    // Simple HTML to text conversion
    return html
        .replace(/<style[^>]*>.*?<\/style>/gis, '')
        .replace(/<script[^>]*>.*?<\/script>/gis, '')
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .trim();
}
//# sourceMappingURL=premium-templates.js.map