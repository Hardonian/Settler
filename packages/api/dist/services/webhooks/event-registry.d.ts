/**
 * Webhook Event Registry
 *
 * Centralized registry of all webhook events that can be subscribed to.
 * This ensures external developers can integrate without reading internal code.
 */
/**
 * Webhook event types available for subscription
 */
export declare enum WebhookEventType {
    INGESTION_STARTED = "ingestion.started",
    INGESTION_COMPLETED = "ingestion.completed",
    INGESTION_FAILED = "ingestion.failed",
    RECONCILIATION_STARTED = "reconciliation.started",
    RECONCILIATION_COMPLETED = "reconciliation.completed",
    RECONCILIATION_FAILED = "reconciliation.failed",
    RECONCILIATION_PARTIAL = "reconciliation.partial",
    JOB_CREATED = "job.created",
    JOB_UPDATED = "job.updated",
    JOB_DELETED = "job.deleted",
    JOB_RUN_STARTED = "job.run.started",
    JOB_RUN_COMPLETED = "job.run.completed",
    JOB_RUN_FAILED = "job.run.failed",
    EXPORT_STARTED = "export.started",
    EXPORT_COMPLETED = "export.completed",
    EXPORT_FAILED = "export.failed",
    EXCEPTION_CREATED = "exception.created",
    EXCEPTION_RESOLVED = "exception.resolved",
    EXCEPTION_UPDATED = "exception.updated",
    ACCOUNT_CREATED = "account.created",
    ACCOUNT_UPDATED = "account.updated",
    ACCOUNT_SUSPENDED = "account.suspended",
    API_KEY_CREATED = "api_key.created",
    API_KEY_REVOKED = "api_key.revoked",
    API_KEY_ROTATED = "api_key.rotated"
}
/**
 * Event metadata for documentation and validation
 */
export interface EventMetadata {
    /** Event type identifier */
    type: WebhookEventType;
    /** Human-readable description */
    description: string;
    /** Event payload schema (JSON Schema) */
    schema: Record<string, unknown>;
    /** Whether this event is public (can be subscribed to) */
    public: boolean;
    /** API version when this event was introduced */
    since: string;
    /** API version when this event was deprecated (if applicable) */
    deprecated?: string;
}
/**
 * Event registry mapping event types to their metadata
 */
export declare const EVENT_REGISTRY: Record<WebhookEventType, EventMetadata>;
/**
 * Get all public events that can be subscribed to
 */
export declare function getPublicEvents(): EventMetadata[];
/**
 * Validate event type
 */
export declare function isValidEventType(eventType: string): boolean;
/**
 * Get event metadata
 */
export declare function getEventMetadata(eventType: string): EventMetadata | undefined;
/**
 * Validate event payload against schema
 */
export declare function validateEventPayload(eventType: string, payload: Record<string, unknown>): {
    valid: boolean;
    errors?: string[];
};
//# sourceMappingURL=event-registry.d.ts.map