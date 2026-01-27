"use strict";
/**
 * Reconciliation Service
 * Main service that orchestrates reconciliation workflows
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReconciliationService = void 0;
const ReconciliationCommandHandlers_1 = require("../cqrs/commands/ReconciliationCommandHandlers");
const SagaOrchestrator_1 = require("../sagas/SagaOrchestrator");
const ShopifyStripeReconciliationSaga_1 = require("../sagas/ShopifyStripeReconciliationSaga");
class ReconciliationService {
    commandHandlers;
    sagaOrchestrator;
    constructor(eventStore, eventBus, shopifyAdapter, stripeAdapter) {
        this.commandHandlers = new ReconciliationCommandHandlers_1.ReconciliationCommandHandlers(eventStore, eventBus);
        this.sagaOrchestrator = new SagaOrchestrator_1.SagaOrchestrator(undefined, // Will use default pool
        eventStore, eventBus);
        // Register Shopify-Stripe reconciliation saga
        const shopifyStripeSaga = new ShopifyStripeReconciliationSaga_1.ShopifyStripeReconciliationSaga(eventStore, shopifyAdapter, stripeAdapter);
        this.sagaOrchestrator.registerSaga(shopifyStripeSaga.createDefinition());
        // Subscribe to reconciliation started events to trigger saga
        eventBus.subscribe('reconciliation.started', async (event) => {
            // Type guard to check if event has required properties
            if ('reconciliationId' in event && 'jobId' in event && 'correlationId' in event) {
                const reconciliationId = event.reconciliationId;
                const jobId = event.jobId;
                const correlationId = event.correlationId;
                const tenantId = 'tenantId' in event ? event.tenantId : 'default';
                const dateRange = 'dateRange' in event ? event.dateRange : undefined;
                const shopifyConfig = 'shopifyConfig' in event ? event.shopifyConfig : undefined;
                const stripeConfig = 'stripeConfig' in event ? event.stripeConfig : undefined;
                const matchingRules = 'matchingRules' in event ? event.matchingRules : undefined;
                // Start saga
                await this.sagaOrchestrator.startSaga('shopify_stripe_monthly_reconciliation', reconciliationId, {
                    job_id: jobId,
                    started_at: Date.now(),
                    date_range: dateRange || {},
                    shopify_config: shopifyConfig || {},
                    stripe_config: stripeConfig || {},
                    matching_rules: matchingRules || {},
                }, tenantId, correlationId);
            }
        });
    }
    /**
     * Start a reconciliation
     */
    async startReconciliation(command) {
        await this.commandHandlers.handleStartReconciliation(command);
    }
    /**
     * Retry a reconciliation
     */
    async retryReconciliation(command) {
        await this.commandHandlers.handleRetryReconciliation(command);
    }
    /**
     * Cancel a reconciliation
     */
    async cancelReconciliation(command) {
        await this.commandHandlers.handleCancelReconciliation(command);
    }
    /**
     * Get saga orchestrator (for admin operations)
     */
    getSagaOrchestrator() {
        return this.sagaOrchestrator;
    }
}
exports.ReconciliationService = ReconciliationService;
//# sourceMappingURL=ReconciliationService.js.map