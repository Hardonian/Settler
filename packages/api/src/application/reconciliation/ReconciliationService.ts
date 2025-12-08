/**
 * Reconciliation Service
 * Main service that orchestrates reconciliation workflows
 */

import { ReconciliationCommandHandlers } from '../cqrs/commands/ReconciliationCommandHandlers';
import { SagaOrchestrator } from '../sagas/SagaOrchestrator';
import { ShopifyStripeReconciliationSaga } from '../sagas/ShopifyStripeReconciliationSaga';
import { IEventStore } from '../../infrastructure/eventsourcing/EventStore';
import { IEventBus } from '../../infrastructure/events/IEventBus';
import { DomainEvent } from '../../domain/events/DomainEvent';
import { ShopifyAdapter } from '@settler/adapters';
import { StripeAdapter } from '@settler/adapters';
import {
  StartReconciliationCommand,
  RetryReconciliationCommand,
  CancelReconciliationCommand,
} from '../cqrs/commands/ReconciliationCommands';

export class ReconciliationService {
  private commandHandlers: ReconciliationCommandHandlers;
  private sagaOrchestrator: SagaOrchestrator;

  constructor(
    eventStore: IEventStore,
    eventBus: IEventBus,
    shopifyAdapter: ShopifyAdapter,
    stripeAdapter: StripeAdapter
  ) {
    this.commandHandlers = new ReconciliationCommandHandlers(eventStore, eventBus);
    
    this.sagaOrchestrator = new SagaOrchestrator(
      undefined, // Will use default pool
      eventStore,
      eventBus
    );

    // Register Shopify-Stripe reconciliation saga
    const shopifyStripeSaga = new ShopifyStripeReconciliationSaga(
      eventStore,
      shopifyAdapter,
      stripeAdapter
    );
    this.sagaOrchestrator.registerSaga(shopifyStripeSaga.createDefinition());

    // Subscribe to reconciliation started events to trigger saga
    eventBus.subscribe('reconciliation.started', async (event: DomainEvent) => {
      // Type guard to check if event has required properties
      if ('reconciliationId' in event && 'jobId' in event && 'correlationId' in event) {
        const reconciliationId = (event as { reconciliationId: string }).reconciliationId;
        const jobId = (event as { jobId: string }).jobId;
        const correlationId = (event as { correlationId: string }).correlationId;
        const tenantId = 'tenantId' in event ? (event as { tenantId: string }).tenantId : 'default';
        const dateRange = 'dateRange' in event ? (event as { dateRange?: { start: string; end: string } }).dateRange : undefined;
        const shopifyConfig = 'shopifyConfig' in event ? (event as { shopifyConfig?: Record<string, unknown> }).shopifyConfig : undefined;
        const stripeConfig = 'stripeConfig' in event ? (event as { stripeConfig?: Record<string, unknown> }).stripeConfig : undefined;
        const matchingRules = 'matchingRules' in event ? (event as { matchingRules?: Record<string, unknown> }).matchingRules : undefined;

        // Start saga
        await this.sagaOrchestrator.startSaga(
          'shopify_stripe_monthly_reconciliation',
          reconciliationId,
          {
            job_id: jobId,
            started_at: Date.now(),
            date_range: dateRange || {},
            shopify_config: shopifyConfig || {},
            stripe_config: stripeConfig || {},
            matching_rules: matchingRules || {},
          },
          tenantId,
          correlationId
        );
      }
    });
  }

  /**
   * Start a reconciliation
   */
  async startReconciliation(command: StartReconciliationCommand): Promise<void> {
    await this.commandHandlers.handleStartReconciliation(command);
  }

  /**
   * Retry a reconciliation
   */
  async retryReconciliation(command: RetryReconciliationCommand): Promise<void> {
    await this.commandHandlers.handleRetryReconciliation(command);
  }

  /**
   * Cancel a reconciliation
   */
  async cancelReconciliation(command: CancelReconciliationCommand): Promise<void> {
    await this.commandHandlers.handleCancelReconciliation(command);
  }

  /**
   * Get saga orchestrator (for admin operations)
   */
  getSagaOrchestrator(): SagaOrchestrator {
    return this.sagaOrchestrator;
  }
}
