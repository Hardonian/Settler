/**
 * Shopify-Stripe Monthly Reconciliation Saga
 * Concrete saga implementation for monthly reconciliation between Shopify and Stripe
 */
import { SagaDefinition } from './SagaOrchestrator';
import { ShopifyAdapter } from '@settler/adapters';
import { StripeAdapter } from '@settler/adapters';
import { IEventStore } from '../../infrastructure/eventsourcing/EventStore';
export declare class ShopifyStripeReconciliationSaga {
    private eventStore;
    private shopifyAdapter;
    private stripeAdapter;
    private shopifyCircuitBreaker;
    private stripeCircuitBreaker;
    constructor(eventStore: IEventStore, shopifyAdapter: ShopifyAdapter, stripeAdapter: StripeAdapter);
    /**
     * Create saga definition
     */
    createDefinition(): SagaDefinition;
    /**
     * Step 1: Fetch orders from Shopify
     */
    private createFetchShopifyOrdersStep;
    /**
     * Step 2: Fetch payments from Stripe
     */
    private createFetchStripePaymentsStep;
    /**
     * Step 3: Perform matching
     */
    private createMatchingStep;
    /**
     * Step 4: Persist results
     */
    private createPersistResultsStep;
    /**
     * Step 5: Notify via webhooks
     */
    private createNotifyWebhooksStep;
    /**
     * Handle saga completion
     */
    private handleSagaComplete;
    /**
     * Handle saga failure
     */
    private handleSagaFailure;
}
//# sourceMappingURL=ShopifyStripeReconciliationSaga.d.ts.map