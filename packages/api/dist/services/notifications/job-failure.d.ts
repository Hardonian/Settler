/**
 * Job Failure Notification Service
 *
 * Sends notifications when reconciliation jobs fail.
 * Enterprise-ready with:
 * - Type-safe Prisma queries
 * - Comprehensive error handling
 * - Idempotent operations
 * - Multiple notification channels (email, webhook)
 */
import { PrismaClient } from '@prisma/client';
interface JobFailureNotificationParams {
    jobId: string;
    resultId: string;
    errorMessage: string;
    errorStack?: string;
    tenantId: string;
    userId: string;
}
/**
 * Notify user about job failure
 */
export declare function notifyJobFailure(prisma: PrismaClient, params: JobFailureNotificationParams): Promise<void>;
/**
 * Notify user about job completion (success)
 */
export declare function notifyJobCompletion(prisma: PrismaClient, params: {
    jobId: string;
    resultId: string;
    tenantId: string;
    matchedCount: number;
    unmatchedCount: number;
    accuracy: number;
}): Promise<void>;
export {};
//# sourceMappingURL=job-failure.d.ts.map