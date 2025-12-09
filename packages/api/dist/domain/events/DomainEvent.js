"use strict";
/**
 * Domain Event Base Class
 * All domain events extend this base class
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookDeliveryFailedEvent = exports.WebhookDeliveredEvent = exports.WebhookReceivedEvent = exports.JobExecutionFailedEvent = exports.JobExecutionCompletedEvent = exports.JobExecutionStartedEvent = exports.JobUpdatedEvent = exports.JobCreatedEvent = exports.UserDeletedEvent = exports.UserCreatedEvent = exports.DomainEvent = void 0;
class DomainEvent {
    occurredOn;
    eventId;
    constructor() {
        this.occurredOn = new Date();
        this.eventId = crypto.randomUUID();
    }
}
exports.DomainEvent = DomainEvent;
/**
 * User Domain Events
 */
class UserCreatedEvent extends DomainEvent {
    userId;
    email;
    constructor(userId, email) {
        super();
        this.userId = userId;
        this.email = email;
    }
    get eventName() {
        return 'user.created';
    }
}
exports.UserCreatedEvent = UserCreatedEvent;
class UserDeletedEvent extends DomainEvent {
    userId;
    constructor(userId) {
        super();
        this.userId = userId;
    }
    get eventName() {
        return 'user.deleted';
    }
}
exports.UserDeletedEvent = UserDeletedEvent;
/**
 * Job Domain Events
 */
class JobCreatedEvent extends DomainEvent {
    jobId;
    userId;
    name;
    constructor(jobId, userId, name) {
        super();
        this.jobId = jobId;
        this.userId = userId;
        this.name = name;
    }
    get eventName() {
        return 'job.created';
    }
}
exports.JobCreatedEvent = JobCreatedEvent;
class JobUpdatedEvent extends DomainEvent {
    jobId;
    userId;
    changes;
    constructor(jobId, userId, changes) {
        super();
        this.jobId = jobId;
        this.userId = userId;
        this.changes = changes;
    }
    get eventName() {
        return 'job.updated';
    }
}
exports.JobUpdatedEvent = JobUpdatedEvent;
class JobExecutionStartedEvent extends DomainEvent {
    executionId;
    jobId;
    constructor(executionId, jobId) {
        super();
        this.executionId = executionId;
        this.jobId = jobId;
    }
    get eventName() {
        return 'job.execution.started';
    }
}
exports.JobExecutionStartedEvent = JobExecutionStartedEvent;
class JobExecutionCompletedEvent extends DomainEvent {
    executionId;
    jobId;
    summary;
    constructor(executionId, jobId, summary) {
        super();
        this.executionId = executionId;
        this.jobId = jobId;
        this.summary = summary;
    }
    get eventName() {
        return 'job.execution.completed';
    }
}
exports.JobExecutionCompletedEvent = JobExecutionCompletedEvent;
class JobExecutionFailedEvent extends DomainEvent {
    executionId;
    jobId;
    error;
    constructor(executionId, jobId, error) {
        super();
        this.executionId = executionId;
        this.jobId = jobId;
        this.error = error;
    }
    get eventName() {
        return 'job.execution.failed';
    }
}
exports.JobExecutionFailedEvent = JobExecutionFailedEvent;
/**
 * Webhook Domain Events
 */
class WebhookReceivedEvent extends DomainEvent {
    adapter;
    payloadId;
    constructor(adapter, payloadId) {
        super();
        this.adapter = adapter;
        this.payloadId = payloadId;
    }
    get eventName() {
        return 'webhook.received';
    }
}
exports.WebhookReceivedEvent = WebhookReceivedEvent;
class WebhookDeliveredEvent extends DomainEvent {
    webhookId;
    deliveryId;
    statusCode;
    constructor(webhookId, deliveryId, statusCode) {
        super();
        this.webhookId = webhookId;
        this.deliveryId = deliveryId;
        this.statusCode = statusCode;
    }
    get eventName() {
        return 'webhook.delivered';
    }
}
exports.WebhookDeliveredEvent = WebhookDeliveredEvent;
class WebhookDeliveryFailedEvent extends DomainEvent {
    webhookId;
    deliveryId;
    error;
    attempts;
    constructor(webhookId, deliveryId, error, attempts) {
        super();
        this.webhookId = webhookId;
        this.deliveryId = deliveryId;
        this.error = error;
        this.attempts = attempts;
    }
    get eventName() {
        return 'webhook.delivery.failed';
    }
}
exports.WebhookDeliveryFailedEvent = WebhookDeliveryFailedEvent;
//# sourceMappingURL=DomainEvent.js.map