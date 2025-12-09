/**
 * Reconciliation Service
 * Main service that orchestrates reconciliation workflows
 */
import { SagaOrchestrator } from '../sagas/SagaOrchestrator';
import { IEventStore } from '../../infrastructure/eventsourcing/EventStore';
import { IEventBus } from '../../infrastructure/events/IEventBus';
import { ShopifyAdapter } from '@settler/adapters';
import { StripeAdapter } from '@settler/adapters';
import { StartReconciliationCommand, RetryReconciliationCommand, CancelReconciliationCommand } from '../cqrs/commands/ReconciliationCommands';
export declare class ReconciliationService {
    private commandHandlers;
    private sagaOrchestrator;
    constructor(eventStore: IEventStore, eventBus: IEventBus, shopifyAdapter: ShopifyAdapter, stripeAdapter: StripeAdapter);
    /**
     * Start a reconciliation
     */
    startReconciliation(command: StartReconciliationCommand): Promise<void>;
    /**
     * Retry a reconciliation
     */
    retryReconciliation(command: RetryReconciliationCommand): Promise<void>;
    /**
     * Cancel a reconciliation
     */
    cancelReconciliation(command: CancelReconciliationCommand): Promise<void>;
    /**
     * Get saga orchestrator (for admin operations)
     */
    getSagaOrchestrator(): SagaOrchestrator;
}
//# sourceMappingURL=ReconciliationService.d.ts.map