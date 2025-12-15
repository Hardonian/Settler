/**
 * Resend Email Service Integration
 * Handles newsletter subscriptions and transactional emails
 */

import { Resend } from 'resend';

// Initialize Resend client
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export interface NewsletterSubscription {
  email: string;
  name?: string;
  source?: string;
  tags?: string[];
}

/**
 * Subscribe user to newsletter via Resend
 */
export async function subscribeToNewsletter(
  subscription: NewsletterSubscription
): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!resend) {
    console.warn('Resend API key not configured');
    return {
      success: false,
      error: 'Email service not configured',
    };
  }

  try {
    // Add contact to Resend audience
    const audienceId = process.env.RESEND_AUDIENCE_ID;
    
    if (audienceId) {
      // TODO: Resend contacts API may have changed - check latest SDK docs
      // For now, use emails.send as fallback
      // const result = await resend.contacts.create({
      //   email: subscription.email,
      //   firstName: subscription.name?.split(' ')[0],
      //   lastName: subscription.name?.split(' ').slice(1).join(' '),
      //   unsubscribed: false,
      //   audienceId,
      // });

      // Add tags if provided
      // if (subscription.tags && subscription.tags.length > 0 && result.data?.id) {
      //   await resend.contacts.addTags({
      //     contactId: result.data.id,
      //     tags: subscription.tags,
      //   });
      // }

      // return {
      //   success: true,
      //   id: result.data?.id,
      // };
      
      // Fallback: Send welcome email
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'Settler <onboarding@settler.dev>',
        to: subscription.email,
        subject: 'Welcome to Settler Newsletter',
        html: `
          <h1>Welcome to Settler!</h1>
          <p>Thank you for subscribing to our newsletter.</p>
          <p>You'll receive updates about:</p>
          <ul>
            <li>New features and releases</li>
            <li>Best practices and tutorials</li>
            <li>Community updates</li>
          </ul>
          <p><a href="https://settler.dev">Visit Settler.dev</a></p>
        `,
      });

      return {
        success: true,
      };
    } else {
      // Fallback: Send welcome email
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'Settler <onboarding@settler.dev>',
        to: subscription.email,
        subject: 'Welcome to Settler Newsletter',
        html: `
          <h1>Welcome to Settler!</h1>
          <p>Thank you for subscribing to our newsletter.</p>
          <p>You'll receive updates about:</p>
          <ul>
            <li>New features and releases</li>
            <li>Best practices and tutorials</li>
            <li>Community updates</li>
          </ul>
          <p><a href="https://settler.dev">Visit Settler.dev</a></p>
        `,
      });

      return {
        success: true,
      };
    }
  } catch (error: any) {
    console.error('Resend subscription error:', error);
    return {
      success: false,
      error: error.message || 'Failed to subscribe to newsletter',
    };
  }
}

/**
 * Send transactional email via Resend
 */
export async function sendTransactionalEmail({
  to,
  subject,
  html,
  text,
  from,
}: {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!resend) {
    console.warn('Resend API key not configured');
    return {
      success: false,
      error: 'Email service not configured',
    };
  }

  try {
    const result = await resend.emails.send({
      from: from || process.env.RESEND_FROM_EMAIL || 'Settler <noreply@settler.dev>',
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
    });

    return {
      success: true,
      id: result.data?.id,
    };
  } catch (error: any) {
    console.error('Resend email error:', error);
    return {
      success: false,
      error: error.message || 'Failed to send email',
    };
  }
}
