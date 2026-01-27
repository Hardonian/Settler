/**
 * Email Service
 * Handles sending emails via configured provider (Resend/SendGrid)
 */

import { logInfo, logError } from "../../utils/logger";

export interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

/**
 * Send email via configured provider
 * Currently supports Resend (default) or SendGrid
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const emailProvider = process.env.EMAIL_PROVIDER || "resend";
    const fromEmail = options.from || process.env.EMAIL_FROM || "noreply@settler.dev";

    if (emailProvider === "resend") {
      return await sendViaResend({
        ...options,
        from: fromEmail,
      });
    } else if (emailProvider === "sendgrid") {
      return await sendViaSendGrid({
        ...options,
        from: fromEmail,
      });
    } else {
      logError("Unsupported email provider", new Error(`Provider: ${emailProvider}`));
      return false;
    }
  } catch (error) {
    logError("Failed to send email", error, { to: options.to, subject: options.subject });
    return false;
  }
}

async function loadResendModule(): Promise<typeof import('resend') | null> {
  return import('resend').catch((error: unknown) => {
    logError('Resend SDK not available', error);
    return null;
  });
}

async function loadSendGridModule(): Promise<typeof import('@sendgrid/mail') | null> {
  return import('@sendgrid/mail').catch((error: unknown) => {
    logError('SendGrid SDK not available', error);
    return null;
  });
}

/**
 * Send email via Resend
 */
async function sendViaResend(options: EmailOptions): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    logError("Resend API key not configured", new Error("Missing RESEND_API_KEY"));
    return false;
  }

  // Dynamic import to avoid requiring Resend in package.json if not used
  const resendModule = await loadResendModule();
  if (!resendModule) {
    return false;
  }

  const { Resend } = resendModule;
  const resend = new Resend(apiKey);

  try {
    const emailData: {
      from: string;
      to: string;
      subject: string;
      html?: string;
      text: string;
      reply_to?: string;
    } = {
      from: options.from!,
      to: options.to,
      subject: options.subject,
      text: options.text || "",
    };
    if (options.html) {
      emailData.html = options.html;
    }
    if (options.replyTo) {
      emailData.reply_to = options.replyTo;
    }

    const result = await resend.emails.send(emailData);

    if (result.error) {
      logError("Resend API error", new Error(result.error.message), {
        to: options.to,
        subject: options.subject,
      });
      return false;
    }

    logInfo("Email sent via Resend", {
      to: options.to,
      subject: options.subject,
      id: result.data?.id,
    });

    return true;
  } catch (error) {
    logError("Failed to send email via Resend", error, {
      to: options.to,
      subject: options.subject,
    });
    return false;
  }
}

/**
 * Send email via SendGrid
 */
async function sendViaSendGrid(options: EmailOptions): Promise<boolean> {
  const apiKey = process.env.SENDGRID_API_KEY;

  if (!apiKey) {
    logError("SendGrid API key not configured", new Error("Missing SENDGRID_API_KEY"));
    return false;
  }

  // Dynamic import to avoid requiring SendGrid in package.json if not used
  // Note: @sendgrid/mail types may not be available
  const sgMailModule = await loadSendGridModule();
  if (!sgMailModule) {
    return false;
  }

  const sgMail =
    "default" in sgMailModule ? sgMailModule.default : sgMailModule;

  try {
    sgMail.setApiKey(apiKey);

    const msg = {
      to: options.to,
      from: options.from!,
      subject: options.subject,
      text: options.text || "",
      html: options.html,
      replyTo: options.replyTo,
    };

    await sgMail.send(msg);

    logInfo("Email sent via SendGrid", {
      to: options.to,
      subject: options.subject,
    });

    return true;
  } catch (error) {
    logError("Failed to send email via SendGrid", error, {
      to: options.to,
      subject: options.subject,
    });
    return false;
  }
}

/**
 * Render email template with variables
 */
export function renderEmailTemplate(
  template: string,
  variables: Record<string, string | number | boolean>
): string {
  let rendered = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
    rendered = rendered.replace(regex, String(value));
  }
  return rendered;
}
