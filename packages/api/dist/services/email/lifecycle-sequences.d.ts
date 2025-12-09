/**
 * Complete Lifecycle Email Sequences
 * Day 7, 14, 21, 27, 29, 30 emails for trial users
 */
/**
 * Send Day 7: First Value Email
 */
export declare function sendDay7FirstValueEmail(userId: string): Promise<void>;
/**
 * Send Day 14: Progress Check Email
 */
export declare function sendDay14ProgressEmail(userId: string): Promise<void>;
/**
 * Send Day 21: Feature Deep Dive Email
 */
export declare function sendDay21FeatureEmail(userId: string): Promise<void>;
/**
 * Send Day 27: Trial Expiration Warning
 */
export declare function sendDay27ExpirationWarning(userId: string): Promise<void>;
/**
 * Send Day 29: Final Trial Reminder
 */
export declare function sendDay29FinalReminder(userId: string): Promise<void>;
/**
 * Send Day 30: Trial Ended Email
 */
export declare function sendDay30TrialEnded(userId: string): Promise<void>;
/**
 * Process lifecycle email sequence
 * Sends emails based on trial days remaining
 */
export declare function processLifecycleEmails(): Promise<void>;
//# sourceMappingURL=lifecycle-sequences.d.ts.map