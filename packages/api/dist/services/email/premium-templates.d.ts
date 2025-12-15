/**
 * Premium Email Templates
 * Settler-branded, polished email templates with consistent design
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
/**
 * Welcome email (Day 0)
 */
export declare function getWelcomeEmailTemplate(variables: EmailTemplateVariables): string;
/**
 * Day 1 onboarding email
 */
export declare function getDay1OnboardingEmailTemplate(variables: EmailTemplateVariables): string;
/**
 * Day 3 activation email
 */
export declare function getDay3ActivationEmailTemplate(variables: EmailTemplateVariables): string;
/**
 * Trial expiration warning (3 days)
 */
export declare function getTrialExpirationWarningTemplate(variables: EmailTemplateVariables): string;
/**
 * Final trial reminder (1 day)
 */
export declare function getFinalTrialReminderTemplate(variables: EmailTemplateVariables): string;
/**
 * Trial ended email
 */
export declare function getTrialEndedTemplate(variables: EmailTemplateVariables): string;
/**
 * Generate plain text version from HTML
 */
export declare function getPlainTextVersion(html: string): string;
//# sourceMappingURL=premium-templates.d.ts.map