/**
 * Stripe Usage Sync Service
 *
 * Syncs metered usage to Stripe for billing
 * Part of Phase II: Billing Expansion
 */
import { PrismaClient } from '@prisma/client';
export declare class StripeUsageSync {
    private prisma;
    private stripe;
    constructor(prisma: PrismaClient, stripeKey: string);
    /**
     * Sync usage events to Stripe
     */
    syncUsageToStripe(billingAccountId: string, startDate: Date, endDate: Date): Promise<void>;
    /**
     * Sync usage for current billing period
     */
    syncCurrentPeriod(billingAccountId: string): Promise<void>;
}
//# sourceMappingURL=usage-sync.d.ts.map