/**
 * Reconciliation Run State Machine
 * 
 * Enforces deterministic state transitions with validation.
 * Never allow invalid transitions - fail fast.
 */

export type RunStatus =
  | 'created'
  | 'queued'
  | 'ingesting'
  | 'validating'
  | 'reconciling'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface StateTransition {
  from: RunStatus;
  to: RunStatus;
  allowed: boolean;
  reason?: string;
}

/**
 * Valid state transitions
 */
const VALID_TRANSITIONS: Record<RunStatus, RunStatus[]> = {
  created: ['queued', 'failed', 'cancelled'],
  queued: ['ingesting', 'failed', 'cancelled'],
  ingesting: ['validating', 'failed', 'cancelled'],
  validating: ['reconciling', 'failed', 'cancelled'],
  reconciling: ['completed', 'failed', 'cancelled'],
  completed: [], // Terminal state
  failed: ['queued'], // Can retry by moving back to queued
  cancelled: [], // Terminal state
};

/**
 * Check if a state transition is valid
 */
export function canTransition(
  from: RunStatus,
  to: RunStatus
): { allowed: boolean; reason?: string } {
  // Same state is always allowed (idempotent)
  if (from === to) {
    return { allowed: true };
  }

  // Check if transition is in valid list
  const allowedStates = VALID_TRANSITIONS[from];
  if (!allowedStates || !allowedStates.includes(to)) {
    return {
      allowed: false,
      reason: `Cannot transition from ${from} to ${to}. Valid transitions from ${from}: ${allowedStates.join(', ') || 'none (terminal state)'}`,
    };
  }

  return { allowed: true };
}

/**
 * Transition state with validation
 * Throws if transition is invalid
 */
export function transitionState(
  current: RunStatus,
  next: RunStatus
): RunStatus {
  const { allowed, reason } = canTransition(current, next);
  
  if (!allowed) {
    throw new Error(`Invalid state transition: ${reason || 'unknown reason'}`);
  }

  return next;
}

/**
 * Get next valid states from current state
 */
export function getNextValidStates(current: RunStatus): RunStatus[] {
  return VALID_TRANSITIONS[current] || [];
}

/**
 * Check if state is terminal (no further transitions)
 */
export function isTerminalState(status: RunStatus): boolean {
  return VALID_TRANSITIONS[status]?.length === 0;
}

/**
 * Check if state allows retry
 */
export function canRetry(status: RunStatus): boolean {
  return status === 'failed';
}

/**
 * Get human-readable status label
 */
export function getStatusLabel(status: RunStatus): string {
  const labels: Record<RunStatus, string> = {
    created: 'Created',
    queued: 'Queued',
    ingesting: 'Ingesting',
    validating: 'Validating',
    reconciling: 'Reconciling',
    completed: 'Completed',
    failed: 'Failed',
    cancelled: 'Cancelled',
  };
  return labels[status] || status;
}

/**
 * Get status color for UI
 */
export function getStatusColor(status: RunStatus): string {
  const colors: Record<RunStatus, string> = {
    created: 'slate',
    queued: 'blue',
    ingesting: 'cyan',
    validating: 'yellow',
    reconciling: 'purple',
    completed: 'green',
    failed: 'red',
    cancelled: 'gray',
  };
  return colors[status] || 'slate';
}
