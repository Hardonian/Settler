/**
 * @settler/protocol
 * 
 * Framework-agnostic protocol types for reconciliation workflows.
 * 
 * This package defines the core types and JSON schema for reconciliation
 * UI definitions and rules. It is designed to be consumed by any reconciliation
 * backend, not just Settler's proprietary engine.
 * 
 * Enterprise-grade security, validation, and observability built-in.
 * 
 * @license MIT
 */

// ============================================================================
// Core Entity Types
// ============================================================================

/**
 * Reconciliation Transaction
 * Represents a transaction that needs to be reconciled
 */
export interface ReconciliationTransaction {
  id: string;
  provider: string;
  providerTransactionId: string;
  amount: Money;
  currency: string;
  date: string; // ISO 8601 date string
  status: TransactionStatus;
  metadata?: Record<string, unknown>;
  referenceId?: string;
}

/**
 * Reconciliation Settlement
 * Represents a settlement/payout that needs to be reconciled
 */
export interface ReconciliationSettlement {
  id: string;
  provider: string;
  providerSettlementId: string;
  amount: Money;
  currency: string;
  settlementDate: string; // ISO 8601 date string
  expectedDate?: string; // ISO 8601 date string
  status: SettlementStatus;
  metadata?: Record<string, unknown>;
}

/**
 * Reconciliation Exception
 * Represents an exception requiring manual review
 */
export interface ReconciliationException {
  id: string;
  category: ExceptionCategory;
  severity: ExceptionSeverity;
  description: string;
  transactionId?: string;
  settlementId?: string;
  resolutionStatus: ExceptionResolutionStatus;
  createdAt: string; // ISO 8601 date string
  resolvedAt?: string; // ISO 8601 date string
}

/**
 * Reconciliation Match
 * Represents a successful match between transaction and settlement
 */
export interface ReconciliationMatch {
  id: string;
  transactionId: string;
  settlementId: string;
  matchType: MatchType;
  confidence: number; // 0.00 to 1.00
  matchedAt: string; // ISO 8601 date string
}

// ============================================================================
// Supporting Types
// ============================================================================

export interface Money {
  value: number;
  currency: string; // ISO 4217 currency code
}

export type TransactionStatus = 'pending' | 'succeeded' | 'failed' | 'refunded' | 'disputed';
export type SettlementStatus = 'pending' | 'completed' | 'failed';
export type MatchType = '1-to-1' | '1-to-many' | 'many-to-1';
export type ExceptionCategory = 
  | 'amount_mismatch' 
  | 'date_mismatch' 
  | 'missing_transaction' 
  | 'missing_settlement' 
  | 'duplicate'
  | 'currency_mismatch'
  | 'status_mismatch';
export type ExceptionSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ExceptionResolutionStatus = 'open' | 'in_progress' | 'resolved' | 'dismissed';

// ============================================================================
// Rule Types
// ============================================================================

/**
 * Reconciliation Rule
 * Defines how transactions and settlements should be matched
 */
export interface ReconciliationRule {
  id: string;
  name: string;
  field: RuleField;
  type: RuleType;
  tolerance?: RuleTolerance;
  priority?: number; // Lower number = higher priority
  enabled?: boolean;
}

export type RuleField = 
  | 'transactionId'
  | 'amount'
  | 'date'
  | 'referenceId'
  | 'providerTransactionId'
  | 'providerSettlementId'
  | 'currency';

export type RuleType = 'exact' | 'fuzzy' | 'range' | 'regex';

export interface RuleTolerance {
  amount?: number; // Amount tolerance (e.g., 0.01)
  days?: number; // Date tolerance in days
  percentage?: number; // Percentage tolerance (e.g., 0.01 for 1%)
  threshold?: number; // Confidence threshold for fuzzy matching (0-1)
}

/**
 * Rule Set Configuration
 * Collection of rules with conflict resolution strategy
 */
export interface ReconciliationRuleSet {
  id: string;
  name: string;
  rules: ReconciliationRule[];
  priority: RulePriority;
  conflictResolution?: ConflictResolution;
}

export type RulePriority = 'exact-first' | 'fuzzy-first' | 'custom';
export type ConflictResolution = 'first-wins' | 'last-wins' | 'manual-review';

// ============================================================================
// View Configuration Types
// ============================================================================

/**
 * Reconciliation View Configuration
 * Defines how reconciliation data should be displayed
 */
export interface ReconciliationViewConfig {
  id: string;
  name: string;
  widgets: WidgetConfig[];
  layout?: LayoutConfig;
}

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title?: string;
  props?: Record<string, unknown>;
  position?: WidgetPosition;
}

export type WidgetType = 
  | 'transaction-table'
  | 'exception-table'
  | 'metric-card'
  | 'match-list'
  | 'summary-stats'
  | 'rule-editor'
  | 'filter-bar';

export interface WidgetPosition {
  row: number;
  col: number;
  width?: number; // Grid columns (1-12)
  height?: number; // Grid rows
}

export interface LayoutConfig {
  type: 'grid' | 'flex';
  columns?: number;
  gap?: number;
}

// ============================================================================
// Compiled JSON Config Schema
// ============================================================================

/**
 * Compiled Reconciliation Config
 * This is the JSON output from compiling a React component tree
 */
export interface ReconciliationConfig {
  version: string; // Protocol version (e.g., "1.0.0")
  metadata: {
    name: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
  };
  rulesets: ReconciliationRuleSet[];
  views: ReconciliationViewConfig[];
  widgets: Record<string, WidgetConfig>; // Widget registry
}

// ============================================================================
// Compilation Context Types
// ============================================================================

/**
 * Compilation Mode
 * Determines how React components should be rendered
 */
export type CompilationMode = 'ui' | 'config';

/**
 * Compilation Context
 * Context passed through React tree during compilation
 */
export interface CompilationContext {
  mode: CompilationMode;
  config: Partial<ReconciliationConfig>;
  widgetRegistry: Map<string, WidgetConfig>;
  securityContext?: import('./security').SecurityContext;
  validationRules?: import('./validation').ValidationRules;
}

// Re-export security types
export type {
  SecurityPolicy,
  SecurityContext,
  AuditLogEntry,
  AuditEvent,
  ContentSecurityPolicy,
  ValidationPolicy,
  SanitizationPolicy,
  AuditLoggingPolicy,
  RateLimitingPolicy
} from './security';

// Re-export validation types
export type {
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ValidationRules,
  TransactionValidationRules,
  SettlementValidationRules,
  ExceptionValidationRules,
  RuleValidationRules,
  MoneyValidationRules,
  SchemaValidator
} from './validation';

// Re-export telemetry types
export type {
  TelemetryEvent,
  TelemetryEventType,
  TelemetryContext,
  PerformanceMetrics,
  ErrorTelemetry,
  TelemetryConfig,
  TelemetryProvider
} from './telemetry';

// Re-export error types
export {
  ReconciliationError,
  ValidationError as ProtocolValidationError,
  SecurityError,
  CompilationError,
  ConfigurationError
} from './errors';

// Re-export utilities
export {
  sanitizeString,
  isValidISODate,
  isValidCurrency,
  isValidMoney,
  formatMoney,
  sanitizeTransactionMetadata,
  validateTransactionId,
  maskPII,
  generateSecureId,
  deepClone
} from './utils';
