/**
 * Reconciliation Commands
 * CQRS commands for reconciliation operations
 */

export interface StartReconciliationCommand {
  reconciliation_id: string;
  job_id: string;
  tenant_id: string;
  user_id?: string;
  source_adapter: string;
  target_adapter: string;
  date_range: {
    start: string;
    end: string;
  };
  execution_id?: string;
  correlation_id?: string;
}

export interface RetryReconciliationCommand {
  reconciliation_id: string;
  tenant_id: string;
  user_id?: string;
  from_step?: string;
  execution_id?: string;
  correlation_id?: string;
}

export interface CancelReconciliationCommand {
  reconciliation_id: string;
  tenant_id: string;
  user_id?: string;
  reason?: string;
  correlation_id?: string;
}

export interface PauseReconciliationCommand {
  reconciliation_id: string;
  tenant_id: string;
  user_id?: string;
  reason?: string;
  correlation_id?: string;
}

export interface ResumeReconciliationCommand {
  reconciliation_id: string;
  tenant_id: string;
  user_id?: string;
  correlation_id?: string;
}
