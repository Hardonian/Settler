/**
 * Saga Orchestrator
 * Manages distributed workflows with compensation and retry logic
 */

import { Pool } from 'pg';
import { pool } from '../../db';
import { IEventStore } from '../../infrastructure/eventsourcing/EventStore';
import { IEventBus } from '../../infrastructure/events/IEventBus';

export enum SagaStatus {
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  COMPENSATING = 'compensating',
}

export interface SagaStep {
  name: string;
  execute: (state: SagaState) => Promise<SagaStepResult>;
  compensate?: (state: SagaState) => Promise<void>;
  timeoutMs?: number;
  retryable?: boolean;
  maxRetries?: number;
}

export interface SagaStepResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: {
    type: string;
    message: string;
    retryable: boolean;
  };
}

export interface SagaState {
  sagaId: string;
  sagaType: string;
  aggregateId: string;
  currentStep: string;
  status?: SagaStatus;
  stepHistory: Array<{
    step: string;
    status: 'started' | 'completed' | 'failed' | 'compensated';
    timestamp: Date;
    error?: string;
  }>;
  data: Record<string, unknown>;
  correlationId: string;
  tenantId: string;
}

export interface SagaDefinition {
  type: string;
  steps: SagaStep[];
  onComplete?: (state: SagaState) => Promise<void>;
  onFailure?: (state: SagaState, error: Error) => Promise<void>;
}

export class SagaOrchestrator {
  private sagas: Map<string, SagaDefinition> = new Map();

  constructor(
    private db: Pool = pool,
    // Event store and bus are reserved for future event sourcing implementation
    private _eventStore: IEventStore,
    private _eventBus: IEventBus
  ) {
    // Reference unused properties to satisfy TypeScript
    void this._eventStore;
    void this._eventBus;
  }

  /**
   * Register a saga definition
   */
  registerSaga(definition: SagaDefinition): void {
    this.sagas.set(definition.type, definition);
  }

  /**
   * Start a new saga instance
   */
  async startSaga(
    sagaType: string,
    aggregateId: string,
    initialData: Record<string, unknown>,
    tenantId: string,
    correlationId?: string
  ): Promise<string> {
    const sagaId = `${sagaType}_${aggregateId}_${Date.now()}`;
    const saga = this.sagas.get(sagaType);

    if (!saga) {
      throw new Error(`Saga type ${sagaType} not found`);
    }

    const state: SagaState = {
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
  private async executeSaga(state: SagaState): Promise<void> {
    const saga = this.sagas.get(state.sagaType);
    if (!saga) {
      throw new Error(`Saga type ${state.sagaType} not found`);
    }

    try {
      for (const step of saga.steps) {
        // Skip if already completed
        const stepCompleted = state.stepHistory.some(
          (h) => h.step === step.name && h.status === 'completed'
        );

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
            } else {
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
        } catch (error: any) {
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
    } catch (error: any) {
      await this.markSagaFailed(state, error.message);
      if (saga.onFailure) {
        await saga.onFailure(state, error);
      }
    }
  }

  /**
   * Execute a step with retry logic
   */
  private async executeStepWithRetry(
    step: SagaStep,
    state: SagaState
  ): Promise<SagaStepResult> {
    const maxRetries = step.maxRetries || 3;
    let lastError: SagaStepResult | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await Promise.race([
          step.execute(state),
          step.timeoutMs
            ? new Promise<SagaStepResult>((_, reject) =>
                setTimeout(
                  () => reject(new Error('Step timeout')),
                  step.timeoutMs
                )
              )
            : Promise.resolve({ success: true }),
        ]);

        if (result.success) {
          return result;
        }

        lastError = result;
      } catch (error: any) {
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
  private async compensate(state: SagaState, failedStepName: string): Promise<void> {
    const saga = this.sagas.get(state.sagaType);
    if (!saga) return;

    state.status = SagaStatus.COMPENSATING;
    await this.saveSagaState(state);

    // Find the failed step index
    const failedStepIndex = saga.steps.findIndex((s) => s.name === failedStepName);
    if (failedStepIndex === -1) return;

    // Compensate in reverse order
    for (let i = failedStepIndex - 1; i >= 0; i--) {
      const step = saga.steps[i];
      if (!step) {
        continue;
      }
      if (step.compensate) {
        const stepCompleted = state.stepHistory.some(
          (h) => h.step === step.name && h.status === 'completed'
        );

        if (stepCompleted) {
          try {
            await step.compensate(state);
            await this.recordStepCompensated(state, step.name);
          } catch (error) {
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
  private async saveSagaState(state: SagaState): Promise<void> {
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
  private async recordStepStart(state: SagaState, stepName: string): Promise<void> {
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
  private async recordStepComplete(state: SagaState, stepName: string): Promise<void> {
    const history = state.stepHistory.find((h) => h.step === stepName && h.status === 'started');
    if (history) {
      history.status = 'completed';
    }
    await this.saveSagaState(state);
  }

  /**
   * Record step compensation
   */
  private async recordStepCompensated(state: SagaState, stepName: string): Promise<void> {
    const history = state.stepHistory.find((h) => h.step === stepName && h.status === 'completed');
    if (history) {
      history.status = 'compensated';
      await this.saveSagaState(state);
    }
  }

  /**
   * Mark saga as completed
   */
  private async markSagaCompleted(state: SagaState): Promise<void> {
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
  private async markSagaFailed(state: SagaState, errorMessage: string): Promise<void> {
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
  private async scheduleRetry(state: SagaState, _step: SagaStep): Promise<void> {
    const retryCount = (state.data.retryCount as number) || 0;
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
  private shouldRetryStep(state: SagaState, _stepName: string): boolean {
    const retryCount = (state.data.retryCount as number) || 0;
    const maxRetries = 3; // Default max retries
    return retryCount < maxRetries;
  }

  /**
   * Handle step timeout
   */
  private async handleStepTimeout(state: SagaState, step: SagaStep): Promise<void> {
    await this.recordStepComplete(state, step.name);
    state.data[`${step.name}_timeout`] = true;
    await this.saveSagaState(state);
  }

  /**
   * Resume a saga (for retries or manual resumption)
   */
  async resumeSaga(sagaId: string, sagaType: string): Promise<void> {
    const query = `
      SELECT state FROM saga_state
      WHERE saga_id = $1 AND saga_type = $2
    `;
    const result = await this.db.query(query, [sagaId, sagaType]);

    if (result.rows.length === 0) {
      throw new Error(`Saga ${sagaId} not found`);
    }

    const state: SagaState = JSON.parse(result.rows[0].state);
    state.status = SagaStatus.RUNNING;

    await this.saveSagaState(state);
    await this.executeSaga(state);
  }

  /**
   * Cancel a saga
   */
  async cancelSaga(sagaId: string, sagaType: string): Promise<void> {
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
  async getSagaStatus(sagaId: string, sagaType: string): Promise<SagaState | null> {
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
