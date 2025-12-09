/**
 * Reconciliation Command Handlers
 * Handle commands and emit events
 */
import { IEventStore } from '../../../infrastructure/eventsourcing/EventStore';
import { StartReconciliationCommand, RetryReconciliationCommand, CancelReconciliationCommand, PauseReconciliationCommand, ResumeReconciliationCommand } from './ReconciliationCommands';
import { IEventBus } from '../../../infrastructure/events/IEventBus';
export declare class ReconciliationCommandHandlers {
    private eventStore;
    private eventBus;
    constructor(eventStore: IEventStore, eventBus: IEventBus);
    handleStartReconciliation(command: StartReconciliationCommand): Promise<void>;
    handleRetryReconciliation(command: RetryReconciliationCommand): Promise<void>;
    handleCancelReconciliation(command: CancelReconciliationCommand): Promise<void>;
    handlePauseReconciliation(_command: PauseReconciliationCommand): Promise<void>;
    handleResumeReconciliation(_command: ResumeReconciliationCommand): Promise<void>;
}
//# sourceMappingURL=ReconciliationCommandHandlers.d.ts.map