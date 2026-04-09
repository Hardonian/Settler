/**
 * Domain Event Base Class
 * All domain events extend this base class
 */

export abstract class DomainEvent {
  public readonly occurredOn: Date;
  public readonly eventId: string;

  constructor() {
    this.occurredOn = new Date();
    this.eventId = crypto.randomUUID();
  }

  abstract get eventName(): string;
}

/**
 * User Domain Events
 */
export class UserCreatedEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string
  ) {
    super();
  }

  get eventName(): string {
    return "user.created";
  }
}

export class UserDeletedEvent extends DomainEvent {
  constructor(public readonly userId: string) {
    super();
  }

  get eventName(): string {
    return "user.deleted";
  }
}

/**
 * Job Domain Events
 */
export class JobCreatedEvent extends DomainEvent {
  constructor(
    public readonly jobId: string,
    public readonly userId: string,
    public readonly name: string
  ) {
    super();
  }

  get eventName(): string {
    return "job.created";
  }
}

export class JobUpdatedEvent extends DomainEvent {
  constructor(
    public readonly jobId: string,
    public readonly userId: string,
    public readonly changes: Record<string, unknown>
  ) {
    super();
  }

  get eventName(): string {
    return "job.updated";
  }
}

export class JobExecutionStartedEvent extends DomainEvent {
  constructor(
    public readonly executionId: string,
    public readonly jobId: string
  ) {
    super();
  }

  get eventName(): string {
    return "job.execution.started";
  }
}

export class JobExecutionCompletedEvent extends DomainEvent {
  constructor(
    public readonly executionId: string,
    public readonly jobId: string,
    public readonly summary: {
      matched: number;
      unmatched: number;
      errors: number;
    }
  ) {
    super();
  }

  get eventName(): string {
    return "job.execution.completed";
  }
}

export class JobExecutionFailedEvent extends DomainEvent {
  constructor(
    public readonly executionId: string,
    public readonly jobId: string,
    public readonly error: string
  ) {
    super();
  }

  get eventName(): string {
    return "job.execution.failed";
  }
}

/**
 * Webhook Domain Events
 */
export class WebhookReceivedEvent extends DomainEvent {
  constructor(
    public readonly adapter: string,
    public readonly payloadId: string
  ) {
    super();
  }

  get eventName(): string {
    return "webhook.received";
  }
}

export class WebhookDeliveredEvent extends DomainEvent {
  constructor(
    public readonly webhookId: string,
    public readonly deliveryId: string,
    public readonly statusCode: number
  ) {
    super();
  }

  get eventName(): string {
    return "webhook.delivered";
  }
}

export class WebhookDeliveryFailedEvent extends DomainEvent {
  constructor(
    public readonly webhookId: string,
    public readonly deliveryId: string,
    public readonly error: string,
    public readonly attempts: number
  ) {
    super();
  }

  get eventName(): string {
    return "webhook.delivery.failed";
  }
}
