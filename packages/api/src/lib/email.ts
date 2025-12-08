/**
 * Email Service (Resend)
 * 
 * Transactional email sending via Resend API
 * Used for: sign-up verification, password reset, welcome emails, notifications
 */

import { Resend } from 'resend';
import { logInfo, logError, logWarn } from '../utils/logger';

// Initialize Resend client
const resendApiKey = process.env.RESEND_API_KEY;
const resendFromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@settler.dev';
const resendFromName = process.env.RESEND_FROM_NAME || 'Settler';

let resendClient: Resend | null = null;

if (resendApiKey) {
  resendClient = new Resend(resendApiKey);
} else {
  logWarn('RESEND_API_KEY not set - email sending will be disabled');
}

/**
 * Email template types
 */
export interface EmailTemplate {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  tags?: Array<{ name: string; value: string }>;
}

/**
 * Send email via Resend
 */
export async function sendEmail(template: EmailTemplate): Promise<{ id: string } | null> {
  if (!resendClient) {
    logWarn('Resend client not initialized - email not sent', { to: template.to, subject: template.subject });
    return null;
  }

  try {
    const result = await resendClient.emails.send({
      from: template.from || `${resendFromName} <${resendFromEmail}>`,
      to: Array.isArray(template.to) ? template.to : [template.to],
      subject: template.subject,
      html: template.html,
      text: template.text,
      reply_to: template.replyTo,
      tags: template.tags,
    });

    logInfo('Email sent successfully', {
      emailId: result.id,
      to: template.to,
      subject: template.subject,
    });

    return { id: result.id || 'unknown' };
  } catch (error: any) {
    logError('Failed to send email', error, {
      to: template.to,
      subject: template.subject,
    });
    throw error;
  }
}

/**
 * Email templates
 */

/**
 * Sign-up verification email
 */
export async function sendVerificationEmail(
  email: string,
  verificationLink: string,
  userName?: string
): Promise<{ id: string } | null> {
  const name = userName || email.split('@')[0];
  
  return sendEmail({
    to: email,
    subject: 'Verify your Settler account',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb;">Welcome to Settler, ${name}!</h1>
          <p>Thanks for signing up. Please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Verify Email</a>
          </div>
          <p style="color: #666; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="color: #666; font-size: 14px; word-break: break-all;">${verificationLink}</p>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">This link will expire in 24 hours.</p>
        </body>
      </html>
    `,
    text: `
      Welcome to Settler, ${name}!
      
      Thanks for signing up. Please verify your email address by visiting this link:
      ${verificationLink}
      
      This link will expire in 24 hours.
    `,
    tags: [{ name: 'email_type', value: 'verification' }],
  });
}

/**
 * Password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  resetLink: string,
  userName?: string
): Promise<{ id: string } | null> {
  const name = userName || email.split('@')[0];
  
  return sendEmail({
    to: email,
    subject: 'Reset your Settler password',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb;">Password Reset Request</h1>
          <p>Hi ${name},</p>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
          </div>
          <p style="color: #666; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="color: #666; font-size: 14px; word-break: break-all;">${resetLink}</p>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">This link will expire in 1 hour.</p>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">If you didn't request this, you can safely ignore this email.</p>
        </body>
      </html>
    `,
    text: `
      Password Reset Request
      
      Hi ${name},
      
      We received a request to reset your password. Visit this link to create a new password:
      ${resetLink}
      
      This link will expire in 1 hour.
      
      If you didn't request this, you can safely ignore this email.
    `,
    tags: [{ name: 'email_type', value: 'password_reset' }],
  });
}

/**
 * Welcome email (after verification)
 */
export async function sendWelcomeEmail(
  email: string,
  userName?: string,
  dashboardLink?: string
): Promise<{ id: string } | null> {
  const name = userName || email.split('@')[0];
  const dashboard = dashboardLink || 'https://app.settler.dev/dashboard';
  
  return sendEmail({
    to: email,
    subject: 'Welcome to Settler! 🎉',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb;">Welcome to Settler, ${name}! 🎉</h1>
          <p>Your account is now verified and ready to use.</p>
          <p>Get started by:</p>
          <ul>
            <li>Creating your first reconciliation job</li>
            <li>Connecting your payment adapters (Stripe, PayPal, etc.)</li>
            <li>Exploring the dashboard</li>
          </ul>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${dashboard}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Go to Dashboard</a>
          </div>
          <p style="color: #666; font-size: 14px;">Need help? Check out our <a href="https://docs.settler.dev">documentation</a> or reach out to <a href="mailto:support@settler.dev">support@settler.dev</a>.</p>
        </body>
      </html>
    `,
    text: `
      Welcome to Settler, ${name}! 🎉
      
      Your account is now verified and ready to use.
      
      Get started by creating your first reconciliation job and connecting your payment adapters.
      
      Go to your dashboard: ${dashboard}
      
      Need help? Check out our documentation or reach out to support@settler.dev.
    `,
    tags: [{ name: 'email_type', value: 'welcome' }],
  });
}

/**
 * Notification email (for important events)
 */
export async function sendNotificationEmail(
  email: string,
  title: string,
  message: string,
  actionLink?: string,
  actionText?: string,
  userName?: string
): Promise<{ id: string } | null> {
  const name = userName || email.split('@')[0];
  
  return sendEmail({
    to: email,
    subject: title,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb;">${title}</h1>
          <p>Hi ${name},</p>
          <p>${message}</p>
          ${actionLink && actionText ? `
            <div style="text-align: center; margin: 30px 0;">
              <a href="${actionLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">${actionText}</a>
            </div>
          ` : ''}
        </body>
      </html>
    `,
    text: `
      ${title}
      
      Hi ${name},
      
      ${message}
      
      ${actionLink ? `Visit: ${actionLink}` : ''}
    `,
    tags: [{ name: 'email_type', value: 'notification' }],
  });
}

/**
 * Magic link email (passwordless login)
 */
export async function sendMagicLinkEmail(
  email: string,
  magicLink: string,
  userName?: string
): Promise<{ id: string } | null> {
  const name = userName || email.split('@')[0];
  
  return sendEmail({
    to: email,
    subject: 'Sign in to Settler',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb;">Sign in to Settler</h1>
          <p>Hi ${name},</p>
          <p>Click the button below to sign in to your account:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${magicLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Sign In</a>
          </div>
          <p style="color: #666; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="color: #666; font-size: 14px; word-break: break-all;">${magicLink}</p>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">This link will expire in 15 minutes.</p>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">If you didn't request this, you can safely ignore this email.</p>
        </body>
      </html>
    `,
    text: `
      Sign in to Settler
      
      Hi ${name},
      
      Click this link to sign in to your account:
      ${magicLink}
      
      This link will expire in 15 minutes.
      
      If you didn't request this, you can safely ignore this email.
    `,
    tags: [{ name: 'email_type', value: 'magic_link' }],
  });
}
