/**
 * Onboarding Email Sequence
 * Automated email sequences for new users
 */
/**
 * Send Day 0 welcome email
 */
export declare function sendDay0WelcomeEmail(userId: string): Promise<void>;
/**
 * Send Day 1 onboarding email
 */
export declare function sendDay1OnboardingEmail(userId: string): Promise<void>;
/**
 * Send Day 3 activation email
 */
export declare function sendDay3ActivationEmail(userId: string): Promise<void>;
/**
 * Process onboarding email sequence
 * Sends emails based on user signup date
 */
export declare function processOnboardingEmails(): Promise<void>;
//# sourceMappingURL=onboarding-sequence.d.ts.map