/**
 * Settler Domain Types
 * 
 * Core domain model types aligned to product tenets:
 * - Change detection WITH meaning (not raw diffs)
 * - Actionable reconciliation (impact-first, ownership, urgency)
 * - Audit-ready receipts (boring, perfect, immutable)
 * - Intelligent alerting (signal, rare, relevant, explained)
 */

// ============================================================================
// Core Identifiers
// ============================================================================

export type TenantId = string;
export type UserId = string;
export type SourceId = string;
export type EventId = string;
export type ReconciliationId = string;
export type ReceiptId = string;
export type AlertId = string;
export type FlagKey = string;

// ============================================================================
// Event Severity
// ============================================================================

export type EventSeverity = 'info' | 'warning' | 'critical';

// ============================================================================
// Impact Model
// ============================================================================

export interface CurrencyImpact {
  amount: number;
  currency: string;
}

export interface Impact {
  currency?: CurrencyImpact;
  riskScore: number; // 0..1
  confidence: number; // 0..1
}

// ============================================================================
// Explanation Model
// ============================================================================

export interface Evidence {
  type: 'hash' | 'source_ref' | 'transaction_id' | 'receipt_id';
  value: string;
  description?: string;
}

export interface Explanation {
  summary: string;
  whyItMatters: string;
  evidence: Evidence[];
  suggestedNextStep?: string;
}

// ============================================================================
// Meaningful Change (Judgment Layer)
// ============================================================================

export interface MeaningfulChange {
  id: EventId;
  event: {
    type: string;
    sourceId: SourceId;
    timestamp: Date;
    rawData: Record<string, unknown>;
  };
  explanation: Explanation;
  impact: Impact;
  owner?: UserId;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0..1
  createdAt: Date;
}

// ============================================================================
// Reconciliation Types
// ============================================================================

export interface ReconciliationItem {
  id: string;
  reconciliationId: ReconciliationId;
  sourceId: SourceId;
  sourceAmount: number;
  sourceCurrency: string;
  targetAmount: number;
  targetCurrency: string;
  delta: number;
  status: 'matched' | 'unmatched' | 'conflict' | 'reviewed';
  impact: Impact;
  explanation: Explanation;
  owner?: UserId;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  createdAt: Date;
}

export interface ReconciliationSummary {
  id: ReconciliationId;
  tenantId: TenantId;
  sourceId: SourceId;
  status: 'running' | 'completed' | 'failed';
  totalDelta: number;
  currency: string;
  mismatchCount: number;
  highestRiskItem?: ReconciliationItem;
  startedAt: Date;
  completedAt?: Date;
}

// ============================================================================
// Receipt Types
// ============================================================================

export interface Receipt {
  id: ReceiptId;
  tenantId: TenantId;
  sourceId?: SourceId;
  canonicalJson: Record<string, unknown>;
  hash: string; // SHA256 hash of canonical JSON
  prevHash?: string; // Previous receipt hash for chain
  evidenceRefs: Evidence[];
  narrative: {
    summary: string;
    whyItMatters: string;
    nextSteps?: string;
  };
  createdBy: UserId;
  createdAt: Date;
}

// ============================================================================
// Alert Types
// ============================================================================

export interface Alert {
  id: AlertId;
  tenantId: TenantId;
  severity: EventSeverity;
  title: string;
  message: string;
  explanation: Explanation;
  threshold?: {
    type: string;
    value: number;
    actual: number;
  };
  acknowledged: boolean;
  acknowledgedBy?: UserId;
  acknowledgedAt?: Date;
  createdAt: Date;
}

// ============================================================================
// Feature Flag Types
// ============================================================================

export type FlagType = 'boolean' | 'number' | 'string' | 'json';

export interface FlagDefinition {
  key: FlagKey;
  description: string;
  type: FlagType;
  default: boolean | number | string | Record<string, unknown>;
  scope: 'tenant' | 'global';
  validation?: {
    min?: number;
    max?: number;
    enum?: (string | number)[];
  };
  rolloutNotes?: string;
}

export interface FlagValue {
  key: FlagKey;
  value: boolean | number | string | Record<string, unknown>;
  tenantId?: TenantId;
  updatedAt: Date;
}
