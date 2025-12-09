/**
 * Email Service
 * Handles sending emails via configured provider (Resend/SendGrid)
 */
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
export declare function sendEmail(options: EmailOptions): Promise<boolean>;
/**
 * Render email template with variables
 */
export declare function renderEmailTemplate(template: string, variables: Record<string, string | number | boolean>): string;
//# sourceMappingURL=email-service.d.ts.map