/**
 * UX Event Types
 *
 * Typed events for tracking user interactions and flow progress.
 * No PII, no secrets - only interaction patterns.
 */

/**
 * Base event structure
 */
export interface UXEvent {
  /** Event type */
  type: string;
  /** Timestamp (ISO string) */
  timestamp: string;
  /** Event ID (for deduplication) */
  id: string;
  /** Route/page where event occurred */
  route?: string;
}

/**
 * Step viewed event
 */
export interface StepViewedEvent extends UXEvent {
  type: "step_viewed";
  /** Step identifier */
  stepId: string;
  /** Step name/title */
  stepName: string;
  /** Flow identifier (e.g., 'onboarding', 'signup') */
  flowId: string;
}

/**
 * Step completed event
 */
export interface StepCompletedEvent extends UXEvent {
  type: "step_completed";
  /** Step identifier */
  stepId: string;
  /** Step name/title */
  stepName: string;
  /** Flow identifier */
  flowId: string;
  /** Time taken in milliseconds */
  duration?: number;
}

/**
 * Flow started event
 */
export interface FlowStartedEvent extends UXEvent {
  type: "flow_started";
  /** Flow identifier */
  flowId: string;
  /** Flow name */
  flowName: string;
}

/**
 * Flow completed event
 */
export interface FlowCompletedEvent extends UXEvent {
  type: "flow_completed";
  /** Flow identifier */
  flowId: string;
  /** Flow name */
  flowName: string;
  /** Total time taken in milliseconds */
  duration: number;
  /** Steps completed */
  stepsCompleted: number;
  /** Steps skipped */
  stepsSkipped?: number;
}

/**
 * Flow abandoned event
 */
export interface FlowAbandonedEvent extends UXEvent {
  type: "flow_abandoned";
  /** Flow identifier */
  flowId: string;
  /** Flow name */
  flowName: string;
  /** Last step reached */
  lastStepId: string;
  /** Progress percentage */
  progress: number;
}

/**
 * Error occurred event
 */
export interface ErrorOccurredEvent extends UXEvent {
  type: "error_occurred";
  /** Error message (sanitized, no PII) */
  errorMessage: string;
  /** Error type/code */
  errorType?: string;
  /** Flow identifier (if in a flow) */
  flowId?: string;
  /** Step identifier (if in a step) */
  stepId?: string;
  /** Whether error was recovered */
  recovered?: boolean;
}

/**
 * Retry attempted event
 */
export interface RetryAttemptedEvent extends UXEvent {
  type: "retry_attempted";
  /** Flow identifier */
  flowId: string;
  /** Step identifier */
  stepId: string;
  /** Retry count */
  retryCount: number;
}

/**
 * Success feedback shown event
 */
export interface SuccessFeedbackShownEvent extends UXEvent {
  type: "success_feedback_shown";
  /** Flow identifier */
  flowId?: string;
  /** Step identifier */
  stepId?: string;
  /** Feedback type */
  feedbackType: "toast" | "badge" | "achievement";
}

/**
 * All UX event types
 */
export type UXEventType =
  | StepViewedEvent
  | StepCompletedEvent
  | FlowStartedEvent
  | FlowCompletedEvent
  | FlowAbandonedEvent
  | ErrorOccurredEvent
  | RetryAttemptedEvent
  | SuccessFeedbackShownEvent;

/**
 * Event metadata
 */
export interface UXEventMetadata {
  /** User agent (sanitized) */
  userAgent?: string;
  /** Screen size category */
  screenSize?: "mobile" | "tablet" | "desktop";
  /** Reduced motion preference */
  reducedMotion?: boolean;
}
