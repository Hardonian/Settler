/**
 * Security Types and Utilities
 * Enterprise-grade security features for reconciliation workflows
 */
/**
 * Security Policy Configuration
 * Defines security constraints for reconciliation workflows
 */
export interface SecurityPolicy {
    /** Content Security Policy settings */
    contentSecurityPolicy?: ContentSecurityPolicy;
    /** Input validation rules */
    validation?: ValidationPolicy;
    /** Sanitization rules */
    sanitization?: SanitizationPolicy;
    /** Audit logging configuration */
    auditLogging?: AuditLoggingPolicy;
    /** Rate limiting configuration */
    rateLimiting?: RateLimitingPolicy;
}
export interface ContentSecurityPolicy {
    /** Allowed script sources */
    scriptSrc?: string[];
    /** Allowed style sources */
    styleSrc?: string[];
    /** Allowed image sources */
    imgSrc?: string[];
    /** Allowed connect sources (API endpoints) */
    connectSrc?: string[];
    /** Enable strict-dynamic */
    strictDynamic?: boolean;
}
export interface ValidationPolicy {
    /** Maximum transaction amount */
    maxTransactionAmount?: number;
    /** Maximum number of transactions per batch */
    maxTransactionsPerBatch?: number;
    /** Maximum date range in days */
    maxDateRangeDays?: number;
    /** Required fields */
    requiredFields?: string[];
    /** Field length limits */
    fieldLengthLimits?: Record<string, number>;
    /** Regex patterns for validation */
    patterns?: Record<string, string>;
}
export interface SanitizationPolicy {
    /** Sanitize HTML in descriptions */
    sanitizeHtml?: boolean;
    /** Sanitize metadata */
    sanitizeMetadata?: boolean;
    /** Allowed HTML tags */
    allowedHtmlTags?: string[];
    /** Allowed HTML attributes */
    allowedHtmlAttributes?: string[];
}
export interface AuditLoggingPolicy {
    /** Enable audit logging */
    enabled: boolean;
    /** Log level */
    level: 'none' | 'minimal' | 'standard' | 'verbose';
    /** Events to log */
    events?: AuditEvent[];
    /** PII masking */
    maskPII?: boolean;
}
export type AuditEvent = 'transaction.created' | 'transaction.updated' | 'settlement.created' | 'exception.created' | 'exception.resolved' | 'rule.executed' | 'config.compiled' | 'export.generated' | 'data.accessed';
export interface RateLimitingPolicy {
    /** Requests per minute */
    requestsPerMinute?: number;
    /** Requests per hour */
    requestsPerHour?: number;
    /** Requests per day */
    requestsPerDay?: number;
}
/**
 * Audit Log Entry
 * Records security and compliance events
 */
export interface AuditLogEntry {
    id: string;
    timestamp: string;
    event: AuditEvent;
    userId?: string;
    sessionId?: string;
    ipAddress?: string;
    userAgent?: string;
    resource?: string;
    action: string;
    result: 'success' | 'failure' | 'warning';
    metadata?: Record<string, unknown>;
    piiMasked?: boolean;
}
/**
 * Security Context
 * Runtime security information
 */
export interface SecurityContext {
    /** Current user ID */
    userId?: string;
    /** Session ID */
    sessionId?: string;
    /** IP address */
    ipAddress?: string;
    /** User agent */
    userAgent?: string;
    /** Permissions */
    permissions?: string[];
    /** Roles */
    roles?: string[];
}
//# sourceMappingURL=security.d.ts.map