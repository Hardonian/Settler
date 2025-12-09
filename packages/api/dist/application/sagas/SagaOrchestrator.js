"use strict";
/**
 * Saga Orchestrator
 * Manages distributed workflows with compensation and retry logic
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SagaOrchestrator = exports.SagaStatus = void 0;
const db_1 = require("../../db");
var SagaStatus;
(function (SagaStatus) {
    SagaStatus["RUNNING"] = "running";
    SagaStatus["COMPLETED"] = "completed";
    SagaStatus["FAILED"] = "failed";
    SagaStatus["CANCELLED"] = "cancelled";
    SagaStatus["COMPENSATING"] = "compensating";
})(SagaStatus || (exports.SagaStatus = SagaStatus = {}));
class SagaOrchestrator {
    db;
    _eventStore;
    _eventBus;
    sagas = new Map();
    constructor(db = db_1.pool, 
    // Event store and bus are reserved for future event sourcing implementation
    _eventStore, _eventBus) {
        this.db = db;
        this._eventStore = _eventStore;
        this._eventBus = _eventBus;
        // Reference unused properties to satisfy TypeScript
        void this._eventStore;
        void this._eventBus;
    }
    /**
     * Register a saga definition
     */
    registerSaga(definition) {
        this.sagas.set(definition.type, definition);
    }
    /**
     * Start a new saga instance
     */
    async startSaga(sagaType, aggregateId, initialData, tenantId, correlationId) {
        const sagaId = `${sagaType}_${aggregateId}_${Date.now()}`;
        const saga = this.sagas.get(sagaType);
        if (!saga) {
            throw new Error(`Saga type ${sagaType} not found`);
        }
        const state = {
            sagaId,
            sagaType,
            aggregateId,
            currentStep: saga.steps[0]?.name || '',
            stepHistory: [],
            data: initialData,
            correlationId: correlationId || crypto.randomUUID(),
            tenantId,
        };
        await this.saveSagaState(state);
        // Start executing the saga
        this.executeSaga(state).catch((error) => {
            console.error(`Saga ${sagaId} failed:`, error);
        });
        return sagaId;
    }
    /**
     * Execute saga steps
     */
    async executeSaga(state) {
        const saga = this.sagas.get(state.sagaType);
        if (!saga) {
            throw new Error(`Saga type ${state.sagaType} not found`);
        }
        try {
            for (const step of saga.steps) {
                // Skip if already completed
                const stepCompleted = state.stepHistory.some((h) => h.step === step.name && h.status === 'completed');
                if (stepCompleted && !this.shouldRetryStep(state, step.name)) {
                    continue;
                }
                state.currentStep = step.name;
                await this.recordStepStart(state, step.name);
                try {
                    const result = await this.executeStepWithRetry(step, state);
                    if (!result.success) {
                        if (result.error?.retryable && step.retryable !== false) {
                            await this.scheduleRetry(state, step);
                            return; // Will retry later
                        }
                        else {
                            // Non-retryable failure, start compensation
                            await this.compensate(state, step.name);
                            await this.markSagaFailed(state, result.error?.message || 'Step failed');
                            if (saga.onFailure) {
                                await saga.onFailure(state, new Error(result.error?.message || 'Unknown error'));
                            }
                            return;
                        }
                    }
                    // Step succeeded
                    state.data = { ...state.data, ...result.data };
                    await this.recordStepComplete(state, step.name);
                }
                catch (error) {
                    // Handle timeout or unexpected errors
                    if (step.timeoutMs && error.name === 'TimeoutError') {
                        await this.handleStepTimeout(state, step);
                        return;
                    }
                    // Try compensation
                    if (step.compensate) {
                        await this.compensate(state, step.name);
                    }
                    await this.markSagaFailed(state, error.message);
                    if (saga.onFailure) {
                        await saga.onFailure(state, error);
                    }
                    return;
                }
            }
            // All steps completed
            await this.markSagaCompleted(state);
            if (saga.onComplete) {
                await saga.onComplete(state);
            }
        }
        catch (error) {
            await this.markSagaFailed(state, error.message);
            if (saga.onFailure) {
                await saga.onFailure(state, error);
            }
        }
    }
    /**
     * Execute a step with retry logic
     */
    async executeStepWithRetry(step, state) {
        const maxRetries = step.maxRetries || 3;
        let lastError;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                const result = await Promise.race([
                    step.execute(state),
                    step.timeoutMs
                        ? new Promise((_, reject) => setTimeout(() => reject(new Error('Step timeout')), step.timeoutMs))
                        : Promise.resolve({ success: true }),
                ]);
                if (result.success) {
                    return result;
                }
                lastError = result;
            }
            catch (error) {
                lastError = {
                    success: false,
                    error: {
                        type: error.name || 'UnknownError',
                        message: error.message,
                        retryable: attempt < maxRetries,
                    },
                };
            }
            // Exponential backoff
            if (attempt < maxRetries) {
                const delayMs = Math.min(1000 * Math.pow(2, attempt), 30000);
                await new Promise((resolve) => setTimeout(resolve, delayMs));
            }
        }
        return lastError || {
            success: false,
            error: {
                type: 'MaxRetriesExceeded',
                message: 'Maximum retries exceeded',
                retryable: false,
            },
        };
    }
    /**
     * Compensate for completed steps
     */
    async compensate(state, failedStepName) {
        const saga = this.sagas.get(state.sagaType);
        if (!saga)
            return;
        state.status = SagaStatus.COMPENSATING;
        await this.saveSagaState(state);
        // Find the failed step index
        const failedStepIndex = saga.steps.findIndex((s) => s.name === failedStepName);
        if (failedStepIndex === -1)
            return;
        // Compensate in reverse order
        for (let i = failedStepIndex - 1; i >= 0; i--) {
            const step = saga.steps[i];
            if (!step) {
                continue;
            }
            if (step.compensate) {
                const stepCompleted = state.stepHistory.some((h) => h.step === step.name && h.status === 'completed');
                if (stepCompleted) {
                    try {
                        await step.compensate(state);
                        await this.recordStepCompensated(state, step.name);
                    }
                    catch (error) {
                        console.error(`Compensation failed for step ${step.name}:`, error);
                        // Continue with other compensations
                    }
                }
            }
        }
    }
    /**
     * Save saga state to database
     */
    async saveSagaState(state) {
        const query = `
      INSERT INTO saga_state (
        saga_id,
        saga_type,
        aggregate_id,
        current_step,
        state,
        status,
        tenant_id,
        correlation_id,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      ON CONFLICT (saga_id, saga_type) DO UPDATE SET
        current_step = EXCLUDED.current_step,
        state = EXCLUDED.state,
        status = EXCLUDED.status,
        updated_at = EXCLUDED.updated_at
    `;
        await this.db.query(query, [
            state.sagaId,
            state.sagaType,
            state.aggregateId,
            state.currentStep,
            JSON.stringify(state),
            state.status || SagaStatus.RUNNING,
            state.tenantId,
            state.correlationId,
        ]);
    }
    /**
     * Record step start
     */
    async recordStepStart(state, stepName) {
        state.stepHistory.push({
            step: stepName,
            status: 'started',
            timestamp: new Date(),
        });
        await this.saveSagaState(state);
    }
    /**
     * Record step completion
     */
    async recordStepComplete(state, stepName) {
        const history = state.stepHistory.find((h) => h.step === stepName && h.status === 'started');
        if (history) {
            history.status = 'completed';
        }
        await this.saveSagaState(state);
    }
    /**
     * Record step compensation
     */
    async recordStepCompensated(state, stepName) {
        const history = state.stepHistory.find((h) => h.step === stepName && h.status === 'completed');
        if (history) {
            history.status = 'compensated';
            await this.saveSagaState(state);
        }
    }
    /**
     * Mark saga as completed
     */
    async markSagaCompleted(state) {
        state.status = SagaStatus.COMPLETED;
        await this.saveSagaState(state);
        const query = `
      UPDATE saga_state
      SET completed_at = NOW()
      WHERE saga_id = $1 AND saga_type = $2
    `;
        await this.db.query(query, [state.sagaId, state.sagaType]);
    }
    /**
     * Mark saga as failed
     */
    async markSagaFailed(state, errorMessage) {
        state.status = SagaStatus.FAILED;
        await this.saveSagaState(state);
        const query = `
      UPDATE saga_state
      SET 
        status = 'failed',
        error_message = $1,
        completed_at = NOW()
      WHERE saga_id = $2 AND saga_type = $3
    `;
        await this.db.query(query, [errorMessage, state.sagaId, state.sagaType]);
    }
    /**
     * Schedule retry for a step
     */
    async scheduleRetry(state, _step) {
        const retryCount = state.data.retryCount || 0;
        state.data.retryCount = retryCount + 1;
        const nextRetryAt = new Date();
        nextRetryAt.setSeconds(nextRetryAt.getSeconds() + Math.min(60 * Math.pow(2, retryCount), 3600));
        const query = `
      UPDATE saga_state
      SET 
        retry_count = $1,
        next_retry_at = $2,
        updated_at = NOW()
      WHERE saga_id = $3 AND saga_type = $4
    `;
        await this.db.query(query, [
            retryCount + 1,
            nextRetryAt,
            state.sagaId,
            state.sagaType,
        ]);
    }
    /**
     * Check if step should be retried
     */
    shouldRetryStep(state, _stepName) {
        const retryCount = state.data.retryCount || 0;
        const maxRetries = 3; // Default max retries
        return retryCount < maxRetries;
    }
    /**
     * Handle step timeout
     */
    async handleStepTimeout(state, step) {
        await this.recordStepComplete(state, step.name);
        state.data[`${step.name}_timeout`] = true;
        await this.saveSagaState(state);
    }
    /**
     * Resume a saga (for retries or manual resumption)
     */
    async resumeSaga(sagaId, sagaType) {
        const query = `
      SELECT state FROM saga_state
      WHERE saga_id = $1 AND saga_type = $2
    `;
        const result = await this.db.query(query, [sagaId, sagaType]);
        if (result.rows.length === 0) {
            throw new Error(`Saga ${sagaId} not found`);
        }
        const state = JSON.parse(result.rows[0].state);
        state.status = SagaStatus.RUNNING;
        await this.saveSagaState(state);
        await this.executeSaga(state);
    }
    /**
     * Cancel a saga
     */
    async cancelSaga(sagaId, sagaType) {
        const query = `
      UPDATE saga_state
      SET 
        status = 'cancelled',
        completed_at = NOW(),
        updated_at = NOW()
      WHERE saga_id = $1 AND saga_type = $2
    `;
        await this.db.query(query, [sagaId, sagaType]);
    }
    /**
     * Get saga status
     */
    async getSagaStatus(sagaId, sagaType) {
        const query = `
      SELECT state FROM saga_state
      WHERE saga_id = $1 AND saga_type = $2
    `;
        const result = await this.db.query(query, [sagaId, sagaType]);
        if (result.rows.length === 0) {
            return null;
        }
        return JSON.parse(result.rows[0].state);
    }
}
exports.SagaOrchestrator = SagaOrchestrator;
//# sourceMappingURL=SagaOrchestrator.js.map