/**
 * Activation Funnel Instrumentation
 *
 * Emits canonical lifecycle events for product-led growth tracking.
 * Uses existing UsageEvent table for event storage.
 */
/**
 * Canonical lifecycle event types
 */
export declare enum LifecycleEventType {
    USER_SIGNED_UP = "user.signed_up",
    TENANT_CREATED = "tenant.created",
    PROVIDER_CONNECTED = "provider.connected",
    RECON_FIRST_RUN = "recon.first_run",
    RECON_EXCEPTION_CREATED = "recon.exception_created",
    RECON_EXCEPTION_RESOLVED = "recon.exception_resolved",
    BILLING_CHECKOUT_STARTED = "billing.checkout_started",
    BILLING_CHECKOUT_COMPLETED = "billing.checkout_completed",
    BILLING_PAYMENT_FAILED = "billing.payment_failed",
    BILLING_SUBSCRIPTION_CANCELED = "billing.subscription_canceled"
}
export interface LifecycleEventProperties {
    [key: string]: unknown;
}
/**
 * Emit a lifecycle event
 */
export declare function emitLifecycleEvent(eventType: LifecycleEventType, params: {
    userId?: string;
    tenantId?: string;
    billingAccountId?: string;
    properties?: LifecycleEventProperties;
}): Promise<void>;
/**
 * Get activation funnel metrics
 */
export declare function getActivationFunnelMetrics(params: {
    startDate: Date;
    endDate: Date;
    tenantId?: string;
}): Promise<{
    signups: number;
    tenantsCreated: number;
    providersConnected: number;
    firstRecons: number;
    exceptionsCreated: number;
    exceptionsResolved: number;
    checkoutsStarted: number;
    checkoutsCompleted: number;
    paymentsFailed: number;
    subscriptionsCanceled: number;
    conversionRates: {
        signupToConnect: number;
        connectToRecon: number;
        reconToResolved: number;
        checkoutToCompleted: number;
    };
}>;
//# sourceMappingURL=activation-funnel.d.ts.map