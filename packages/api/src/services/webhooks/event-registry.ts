/**
 * Webhook Event Registry
 * 
 * Centralized registry of all webhook events that can be subscribed to.
 * This ensures external developers can integrate without reading internal code.
 */

/**
 * Webhook event types available for subscription
 */
export enum WebhookEventType {
  // Ingestion events
  INGESTION_STARTED = 'ingestion.started',
  INGESTION_COMPLETED = 'ingestion.completed',
  INGESTION_FAILED = 'ingestion.failed',
  
  // Reconciliation events
  RECONCILIATION_STARTED = 'reconciliation.started',
  RECONCILIATION_COMPLETED = 'reconciliation.completed',
  RECONCILIATION_FAILED = 'reconciliation.failed',
  RECONCILIATION_PARTIAL = 'reconciliation.partial',
  
  // Job events
  JOB_CREATED = 'job.created',
  JOB_UPDATED = 'job.updated',
  JOB_DELETED = 'job.deleted',
  JOB_RUN_STARTED = 'job.run.started',
  JOB_RUN_COMPLETED = 'job.run.completed',
  JOB_RUN_FAILED = 'job.run.failed',
  
  // Export events
  EXPORT_STARTED = 'export.started',
  EXPORT_COMPLETED = 'export.completed',
  EXPORT_FAILED = 'export.failed',
  
  // Exception events
  EXCEPTION_CREATED = 'exception.created',
  EXCEPTION_RESOLVED = 'exception.resolved',
  EXCEPTION_UPDATED = 'exception.updated',
  
  // Account events
  ACCOUNT_CREATED = 'account.created',
  ACCOUNT_UPDATED = 'account.updated',
  ACCOUNT_SUSPENDED = 'account.suspended',
  
  // API key events
  API_KEY_CREATED = 'api_key.created',
  API_KEY_REVOKED = 'api_key.revoked',
  API_KEY_ROTATED = 'api_key.rotated',
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
export const EVENT_REGISTRY: Record<WebhookEventType, EventMetadata> = {
  [WebhookEventType.INGESTION_STARTED]: {
    type: WebhookEventType.INGESTION_STARTED,
    description: 'Triggered when data ingestion starts',
    schema: {
      type: 'object',
      properties: {
        jobId: { type: 'string', description: 'Job ID' },
        source: { type: 'string', description: 'Source adapter name' },
        startedAt: { type: 'string', format: 'date-time' },
      },
      required: ['jobId', 'source', 'startedAt'],
    },
    public: true,
    since: 'v1.0.0',
  },
  
  [WebhookEventType.INGESTION_COMPLETED]: {
    type: WebhookEventType.INGESTION_COMPLETED,
    description: 'Triggered when data ingestion completes successfully',
    schema: {
      type: 'object',
      properties: {
        jobId: { type: 'string' },
        source: { type: 'string' },
        recordsProcessed: { type: 'number' },
        completedAt: { type: 'string', format: 'date-time' },
      },
      required: ['jobId', 'source', 'recordsProcessed', 'completedAt'],
    },
    public: true,
    since: 'v1.0.0',
  },
  
  [WebhookEventType.INGESTION_FAILED]: {
    type: WebhookEventType.INGESTION_FAILED,
    description: 'Triggered when data ingestion fails',
    schema: {
      type: 'object',
      properties: {
        jobId: { type: 'string' },
        source: { type: 'string' },
        error: { type: 'string' },
        failedAt: { type: 'string', format: 'date-time' },
      },
      required: ['jobId', 'source', 'error', 'failedAt'],
    },
    public: true,
    since: 'v1.0.0',
  },
  
  [WebhookEventType.RECONCILIATION_STARTED]: {
    type: WebhookEventType.RECONCILIATION_STARTED,
    description: 'Triggered when reconciliation starts',
    schema: {
      type: 'object',
      properties: {
        jobId: { type: 'string' },
        startedAt: { type: 'string', format: 'date-time' },
      },
      required: ['jobId', 'startedAt'],
    },
    public: true,
    since: 'v1.0.0',
  },
  
  [WebhookEventType.RECONCILIATION_COMPLETED]: {
    type: WebhookEventType.RECONCILIATION_COMPLETED,
    description: 'Triggered when reconciliation completes successfully',
    schema: {
      type: 'object',
      properties: {
        jobId: { type: 'string' },
        summary: {
          type: 'object',
          properties: {
            matched: { type: 'number' },
            unmatchedSource: { type: 'number' },
            unmatchedTarget: { type: 'number' },
            accuracy: { type: 'number' },
          },
        },
        completedAt: { type: 'string', format: 'date-time' },
      },
      required: ['jobId', 'summary', 'completedAt'],
    },
    public: true,
    since: 'v1.0.0',
  },
  
  [WebhookEventType.RECONCILIATION_FAILED]: {
    type: WebhookEventType.RECONCILIATION_FAILED,
    description: 'Triggered when reconciliation fails',
    schema: {
      type: 'object',
      properties: {
        jobId: { type: 'string' },
        error: { type: 'string' },
        failedAt: { type: 'string', format: 'date-time' },
      },
      required: ['jobId', 'error', 'failedAt'],
    },
    public: true,
    since: 'v1.0.0',
  },
  
  [WebhookEventType.RECONCILIATION_PARTIAL]: {
    type: WebhookEventType.RECONCILIATION_PARTIAL,
    description: 'Triggered when reconciliation completes with partial results',
    schema: {
      type: 'object',
      properties: {
        jobId: { type: 'string' },
        summary: { type: 'object' },
        warnings: { type: 'array', items: { type: 'string' } },
        completedAt: { type: 'string', format: 'date-time' },
      },
      required: ['jobId', 'summary', 'completedAt'],
    },
    public: true,
    since: 'v1.0.0',
  },
  
  [WebhookEventType.JOB_CREATED]: {
    type: WebhookEventType.JOB_CREATED,
    description: 'Triggered when a reconciliation job is created',
    schema: {
      type: 'object',
      properties: {
        jobId: { type: 'string' },
        name: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' },
      },
      required: ['jobId', 'name', 'createdAt'],
    },
    public: true,
    since: 'v1.0.0',
  },
  
  [WebhookEventType.JOB_UPDATED]: {
    type: WebhookEventType.JOB_UPDATED,
    description: 'Triggered when a reconciliation job is updated',
    schema: {
      type: 'object',
      properties: {
        jobId: { type: 'string' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
      required: ['jobId', 'updatedAt'],
    },
    public: true,
    since: 'v1.0.0',
  },
  
  [WebhookEventType.JOB_DELETED]: {
    type: WebhookEventType.JOB_DELETED,
    description: 'Triggered when a reconciliation job is deleted',
    schema: {
      type: 'object',
      properties: {
        jobId: { type: 'string' },
        deletedAt: { type: 'string', format: 'date-time' },
      },
      required: ['jobId', 'deletedAt'],
    },
    public: true,
    since: 'v1.0.0',
  },
  
  [WebhookEventType.JOB_RUN_STARTED]: {
    type: WebhookEventType.JOB_RUN_STARTED,
    description: 'Triggered when a job run starts',
    schema: {
      type: 'object',
      properties: {
        jobId: { type: 'string' },
        runId: { type: 'string' },
        startedAt: { type: 'string', format: 'date-time' },
      },
      required: ['jobId', 'runId', 'startedAt'],
    },
    public: true,
    since: 'v1.0.0',
  },
  
  [WebhookEventType.JOB_RUN_COMPLETED]: {
    type: WebhookEventType.JOB_RUN_COMPLETED,
    description: 'Triggered when a job run completes',
    schema: {
      type: 'object',
      properties: {
        jobId: { type: 'string' },
        runId: { type: 'string' },
        completedAt: { type: 'string', format: 'date-time' },
      },
      required: ['jobId', 'runId', 'completedAt'],
    },
    public: true,
    since: 'v1.0.0',
  },
  
  [WebhookEventType.JOB_RUN_FAILED]: {
    type: WebhookEventType.JOB_RUN_FAILED,
    description: 'Triggered when a job run fails',
    schema: {
      type: 'object',
      properties: {
        jobId: { type: 'string' },
        runId: { type: 'string' },
        error: { type: 'string' },
        failedAt: { type: 'string', format: 'date-time' },
      },
      required: ['jobId', 'runId', 'error', 'failedAt'],
    },
    public: true,
    since: 'v1.0.0',
  },
  
  [WebhookEventType.EXPORT_STARTED]: {
    type: WebhookEventType.EXPORT_STARTED,
    description: 'Triggered when an export starts',
    schema: {
      type: 'object',
      properties: {
        exportId: { type: 'string' },
        format: { type: 'string' },
        startedAt: { type: 'string', format: 'date-time' },
      },
      required: ['exportId', 'format', 'startedAt'],
    },
    public: true,
    since: 'v1.0.0',
  },
  
  [WebhookEventType.EXPORT_COMPLETED]: {
    type: WebhookEventType.EXPORT_COMPLETED,
    description: 'Triggered when an export completes',
    schema: {
      type: 'object',
      properties: {
        exportId: { type: 'string' },
        format: { type: 'string' },
        url: { type: 'string' },
        completedAt: { type: 'string', format: 'date-time' },
      },
      required: ['exportId', 'format', 'completedAt'],
    },
    public: true,
    since: 'v1.0.0',
  },
  
  [WebhookEventType.EXPORT_FAILED]: {
    type: WebhookEventType.EXPORT_FAILED,
    description: 'Triggered when an export fails',
    schema: {
      type: 'object',
      properties: {
        exportId: { type: 'string' },
        error: { type: 'string' },
        failedAt: { type: 'string', format: 'date-time' },
      },
      required: ['exportId', 'error', 'failedAt'],
    },
    public: true,
    since: 'v1.0.0',
  },
  
  [WebhookEventType.EXCEPTION_CREATED]: {
    type: WebhookEventType.EXCEPTION_CREATED,
    description: 'Triggered when an exception is created',
    schema: {
      type: 'object',
      properties: {
        exceptionId: { type: 'string' },
        jobId: { type: 'string' },
        type: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' },
      },
      required: ['exceptionId', 'jobId', 'type', 'createdAt'],
    },
    public: true,
    since: 'v1.0.0',
  },
  
  [WebhookEventType.EXCEPTION_RESOLVED]: {
    type: WebhookEventType.EXCEPTION_RESOLVED,
    description: 'Triggered when an exception is resolved',
    schema: {
      type: 'object',
      properties: {
        exceptionId: { type: 'string' },
        resolvedAt: { type: 'string', format: 'date-time' },
      },
      required: ['exceptionId', 'resolvedAt'],
    },
    public: true,
    since: 'v1.0.0',
  },
  
  [WebhookEventType.EXCEPTION_UPDATED]: {
    type: WebhookEventType.EXCEPTION_UPDATED,
    description: 'Triggered when an exception is updated',
    schema: {
      type: 'object',
      properties: {
        exceptionId: { type: 'string' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
      required: ['exceptionId', 'updatedAt'],
    },
    public: true,
    since: 'v1.0.0',
  },
  
  [WebhookEventType.ACCOUNT_CREATED]: {
    type: WebhookEventType.ACCOUNT_CREATED,
    description: 'Triggered when an account is created',
    schema: {
      type: 'object',
      properties: {
        accountId: { type: 'string' },
        email: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' },
      },
      required: ['accountId', 'email', 'createdAt'],
    },
    public: false, // Internal event
    since: 'v1.0.0',
  },
  
  [WebhookEventType.ACCOUNT_UPDATED]: {
    type: WebhookEventType.ACCOUNT_UPDATED,
    description: 'Triggered when an account is updated',
    schema: {
      type: 'object',
      properties: {
        accountId: { type: 'string' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
      required: ['accountId', 'updatedAt'],
    },
    public: false,
    since: 'v1.0.0',
  },
  
  [WebhookEventType.ACCOUNT_SUSPENDED]: {
    type: WebhookEventType.ACCOUNT_SUSPENDED,
    description: 'Triggered when an account is suspended',
    schema: {
      type: 'object',
      properties: {
        accountId: { type: 'string' },
        reason: { type: 'string' },
        suspendedAt: { type: 'string', format: 'date-time' },
      },
      required: ['accountId', 'suspendedAt'],
    },
    public: false,
    since: 'v1.0.0',
  },
  
  [WebhookEventType.API_KEY_CREATED]: {
    type: WebhookEventType.API_KEY_CREATED,
    description: 'Triggered when an API key is created',
    schema: {
      type: 'object',
      properties: {
        apiKeyId: { type: 'string' },
        name: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' },
      },
      required: ['apiKeyId', 'name', 'createdAt'],
    },
    public: false,
    since: 'v1.0.0',
  },
  
  [WebhookEventType.API_KEY_REVOKED]: {
    type: WebhookEventType.API_KEY_REVOKED,
    description: 'Triggered when an API key is revoked',
    schema: {
      type: 'object',
      properties: {
        apiKeyId: { type: 'string' },
        revokedAt: { type: 'string', format: 'date-time' },
      },
      required: ['apiKeyId', 'revokedAt'],
    },
    public: false,
    since: 'v1.0.0',
  },
  
  [WebhookEventType.API_KEY_ROTATED]: {
    type: WebhookEventType.API_KEY_ROTATED,
    description: 'Triggered when an API key is rotated',
    schema: {
      type: 'object',
      properties: {
        oldApiKeyId: { type: 'string' },
        newApiKeyId: { type: 'string' },
        rotatedAt: { type: 'string', format: 'date-time' },
      },
      required: ['oldApiKeyId', 'newApiKeyId', 'rotatedAt'],
    },
    public: false,
    since: 'v1.0.0',
  },
};

/**
 * Get all public events that can be subscribed to
 */
export function getPublicEvents(): EventMetadata[] {
  return Object.values(EVENT_REGISTRY).filter(event => event.public);
}

/**
 * Validate event type
 */
export function isValidEventType(eventType: string): boolean {
  return Object.values(WebhookEventType).includes(eventType as WebhookEventType);
}

/**
 * Get event metadata
 */
export function getEventMetadata(eventType: string): EventMetadata | undefined {
  return EVENT_REGISTRY[eventType as WebhookEventType];
}

/**
 * Validate event payload against schema
 */
export function validateEventPayload(
  eventType: string,
  payload: Record<string, unknown>
): { valid: boolean; errors?: string[] } {
  const metadata = getEventMetadata(eventType);
  if (!metadata) {
    return { valid: false, errors: [`Unknown event type: ${eventType}`] };
  }
  
  // Basic validation - in production, use a JSON Schema validator
  const requiredFields = (metadata.schema.required as string[]) || [];
  const errors: string[] = [];
  
  for (const field of requiredFields) {
    if (!(field in payload)) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}
