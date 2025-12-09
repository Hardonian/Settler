/**
 * Email Service (Resend)
 *
 * Transactional email sending via Resend API
 * Used for: sign-up verification, password reset, welcome emails, notifications
 */
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
    tags?: Array<{
        name: string;
        value: string;
    }>;
}
/**
 * Send email via Resend
 */
export declare function sendEmail(template: EmailTemplate): Promise<{
    id: string;
} | null>;
/**
 * Email templates
 */
/**
 * Sign-up verification email
 */
export declare function sendVerificationEmail(email: string, verificationLink: string, userName?: string): Promise<{
    id: string;
} | null>;
/**
 * Password reset email
 */
export declare function sendPasswordResetEmail(email: string, resetLink: string, userName?: string): Promise<{
    id: string;
} | null>;
/**
 * Welcome email (after verification)
 */
export declare function sendWelcomeEmail(email: string, userName?: string, dashboardLink?: string): Promise<{
    id: string;
} | null>;
/**
 * Notification email (for important events)
 */
export declare function sendNotificationEmail(email: string, title: string, message: string, actionLink?: string, actionText?: string, userName?: string): Promise<{
    id: string;
} | null>;
/**
 * Magic link email (passwordless login)
 */
export declare function sendMagicLinkEmail(email: string, magicLink: string, userName?: string): Promise<{
    id: string;
} | null>;
//# sourceMappingURL=email.d.ts.map