"use strict";
/**
 * Activation Funnel Instrumentation
 *
 * Emits canonical lifecycle events for product-led growth tracking.
 * Uses existing UsageEvent table for event storage.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LifecycleEventType = void 0;
exports.emitLifecycleEvent = emitLifecycleEvent;
exports.getActivationFunnelMetrics = getActivationFunnelMetrics;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
/**
 * Canonical lifecycle event types
 */
var LifecycleEventType;
(function (LifecycleEventType) {
    LifecycleEventType["USER_SIGNED_UP"] = "user.signed_up";
    LifecycleEventType["TENANT_CREATED"] = "tenant.created";
    LifecycleEventType["PROVIDER_CONNECTED"] = "provider.connected";
    LifecycleEventType["RECON_FIRST_RUN"] = "recon.first_run";
    LifecycleEventType["RECON_EXCEPTION_CREATED"] = "recon.exception_created";
    LifecycleEventType["RECON_EXCEPTION_RESOLVED"] = "recon.exception_resolved";
    LifecycleEventType["BILLING_CHECKOUT_STARTED"] = "billing.checkout_started";
    LifecycleEventType["BILLING_CHECKOUT_COMPLETED"] = "billing.checkout_completed";
    LifecycleEventType["BILLING_PAYMENT_FAILED"] = "billing.payment_failed";
    LifecycleEventType["BILLING_SUBSCRIPTION_CANCELED"] = "billing.subscription_canceled";
})(LifecycleEventType || (exports.LifecycleEventType = LifecycleEventType = {}));
/**
 * Emit a lifecycle event
 */
async function emitLifecycleEvent(eventType, params) {
    try {
        const { userId, tenantId, billingAccountId, properties = {} } = params;
        // Find or create billing account if we have userId or tenantId
        let finalBillingAccountId = billingAccountId;
        if (!finalBillingAccountId && userId) {
            const account = await prisma.billingAccount.findFirst({
                where: { userId },
                select: { id: true },
            });
            finalBillingAccountId = account?.id;
        }
        if (!finalBillingAccountId && tenantId) {
            const tenant = await prisma.tenant.findUnique({
                where: { id: tenantId },
                select: { billingAccountId: true },
            });
            finalBillingAccountId = tenant?.billingAccountId || undefined;
        }
        // If still no billing account, create a minimal one for tracking
        if (!finalBillingAccountId && userId) {
            const user = await prisma.billingAccount.findFirst({
                where: { userId },
                select: { id: true, email: true },
            });
            if (!user) {
                // Would need user email - skip for now if not available
                console.warn(`Cannot emit lifecycle event ${eventType}: no billing account found`);
                return;
            }
            finalBillingAccountId = user.id;
        }
        if (!finalBillingAccountId) {
            console.warn(`Cannot emit lifecycle event ${eventType}: no billing account ID available`);
            return;
        }
        // Emit event via UsageEvent table
        await prisma.usageEvent.create({
            data: {
                billingAccountId: finalBillingAccountId,
                userId: userId || null,
                tenantId: tenantId || null,
                eventType,
                quantity: 1,
                unit: 'event',
                metadata: properties,
                timestamp: new Date(),
                aggregated: false,
            },
        });
    }
    catch (error) {
        // Don't throw - event tracking should never break the main flow
        console.error(`Failed to emit lifecycle event ${eventType}:`, error);
    }
}
/**
 * Get activation funnel metrics
 */
async function getActivationFunnelMetrics(params) {
    const { startDate, endDate, tenantId } = params;
    const where = {
        timestamp: {
            gte: startDate,
            lt: endDate,
        },
    };
    if (tenantId) {
        where.tenantId = tenantId;
    }
    const [signups, tenantsCreated, providersConnected, firstRecons, exceptionsCreated, exceptionsResolved, checkoutsStarted, checkoutsCompleted, paymentsFailed, subscriptionsCanceled,] = await Promise.all([
        prisma.usageEvent.count({
            where: {
                ...where,
                eventType: LifecycleEventType.USER_SIGNED_UP,
            },
        }),
        prisma.usageEvent.count({
            where: {
                ...where,
                eventType: LifecycleEventType.TENANT_CREATED,
            },
        }),
        prisma.usageEvent.count({
            where: {
                ...where,
                eventType: LifecycleEventType.PROVIDER_CONNECTED,
            },
        }),
        prisma.usageEvent.count({
            where: {
                ...where,
                eventType: LifecycleEventType.RECON_FIRST_RUN,
            },
        }),
        prisma.usageEvent.count({
            where: {
                ...where,
                eventType: LifecycleEventType.RECON_EXCEPTION_CREATED,
            },
        }),
        prisma.usageEvent.count({
            where: {
                ...where,
                eventType: LifecycleEventType.RECON_EXCEPTION_RESOLVED,
            },
        }),
        prisma.usageEvent.count({
            where: {
                ...where,
                eventType: LifecycleEventType.BILLING_CHECKOUT_STARTED,
            },
        }),
        prisma.usageEvent.count({
            where: {
                ...where,
                eventType: LifecycleEventType.BILLING_CHECKOUT_COMPLETED,
            },
        }),
        prisma.usageEvent.count({
            where: {
                ...where,
                eventType: LifecycleEventType.BILLING_PAYMENT_FAILED,
            },
        }),
        prisma.usageEvent.count({
            where: {
                ...where,
                eventType: LifecycleEventType.BILLING_SUBSCRIPTION_CANCELED,
            },
        }),
    ]);
    const conversionRates = {
        signupToConnect: signups > 0 ? (providersConnected / signups) * 100 : 0,
        connectToRecon: providersConnected > 0 ? (firstRecons / providersConnected) * 100 : 0,
        reconToResolved: exceptionsCreated > 0 ? (exceptionsResolved / exceptionsCreated) * 100 : 0,
        checkoutToCompleted: checkoutsStarted > 0 ? (checkoutsCompleted / checkoutsStarted) * 100 : 0,
    };
    return {
        signups,
        tenantsCreated,
        providersConnected,
        firstRecons,
        exceptionsCreated,
        exceptionsResolved,
        checkoutsStarted,
        checkoutsCompleted,
        paymentsFailed,
        subscriptionsCanceled,
        conversionRates,
    };
}
//# sourceMappingURL=activation-funnel.js.map