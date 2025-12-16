/**
 * Judgment Layer Rules Engine
 * 
 * Deterministic rules for "why this matters" explanations.
 * No LLM required - uses heuristics and business logic.
 * 
 * Rules compound over time as we learn what matters to customers.
 */

import type { MeaningfulChange, Impact, Explanation, Evidence } from '@/lib/domain/types';

// ============================================================================
// Rule: Currency Delta Thresholds
// ============================================================================

const CURRENCY_THRESHOLDS = {
  low: 100,      // $100
  medium: 1000,  // $1,000
  high: 10000,   // $10,000
  critical: 50000, // $50,000
};

function getSeverityFromAmount(delta: number): 'low' | 'medium' | 'high' | 'critical' {
  const absDelta = Math.abs(delta);
  if (absDelta >= CURRENCY_THRESHOLDS.critical) return 'critical';
  if (absDelta >= CURRENCY_THRESHOLDS.high) return 'high';
  if (absDelta >= CURRENCY_THRESHOLDS.medium) return 'medium';
  return 'low';
}

// ============================================================================
// Rule: Repeated Drift Detection
// ============================================================================

interface DriftContext {
  count: number;
  days: number;
  totalDelta: number;
}

function detectRepeatedDrift(
  delta: number,
  recentHistory: Array<{ delta: number; date: Date }>
): DriftContext | null {
  const last7Days = recentHistory.filter(
    (h) => Date.now() - h.date.getTime() < 7 * 24 * 60 * 60 * 1000
  );
  
  if (last7Days.length < 3) return null;
  
  const sameSign = last7Days.every((h) => Math.sign(h.delta) === Math.sign(delta));
  if (!sameSign) return null;
  
  const totalDelta = last7Days.reduce((sum, h) => sum + Math.abs(h.delta), 0) + Math.abs(delta);
  
  return {
    count: last7Days.length + 1,
    days: 7,
    totalDelta,
  };
}

// ============================================================================
// Rule: Compliance/Policy Breach Detection
// ============================================================================

function detectComplianceBreach(
  event: MeaningfulChange['event']
): { breached: boolean; reason?: string } {
  // Check for negative balances (shouldn't happen in reconciliation)
  if (event.type === 'reconciliation' && 'delta' in event.rawData) {
    const delta = event.rawData.delta as number;
    if (delta < 0 && Math.abs(delta) > 1000) {
      return {
        breached: true,
        reason: 'Large negative reconciliation delta may indicate accounting error',
      };
    }
  }
  
  // Check for missing required fields
  if (event.type === 'receipt' && !('total' in event.rawData)) {
    return {
      breached: true,
      reason: 'Receipt missing required total amount',
    };
  }
  
  return { breached: false };
}

// ============================================================================
// Rule: Source Reliability Scoring
// ============================================================================

function getSourceReliabilityScore(sourceId: string): number {
  // In production, this would query historical accuracy
  // For now, return default confidence based on source type
  const sourceType = sourceId.split('_')[0];
  if (!sourceType) return 0.75;
  
  const reliabilityMap: Record<string, number> = {
    stripe: 0.95,
    shopify: 0.90,
    paypal: 0.85,
    manual: 0.70,
  };
  
  return reliabilityMap[sourceType] ?? 0.75;
}

// Note: getSourceReliabilityScore is kept for future use but currently unused

// ============================================================================
// Main Rule Engine: Generate Explanation
// ============================================================================

export function generateExplanation(
  event: MeaningfulChange['event'],
  delta?: number,
  recentHistory?: Array<{ delta: number; date: Date }>
): Explanation {
  const evidence: Evidence[] = [
    {
      type: 'source_ref',
      value: event.sourceId,
      description: `Source: ${event.sourceId}`,
    },
  ];
  
  let summary = '';
  let whyItMatters = '';
  let suggestedNextStep: string | undefined;
  
  // Rule 1: Currency delta analysis
  if (delta !== undefined) {
    const severity = getSeverityFromAmount(delta);
    summary = `Reconciliation delta of ${delta >= 0 ? '+' : ''}${delta.toFixed(2)} detected`;
    
    if (severity === 'critical') {
      whyItMatters = 'This is a critical financial discrepancy that requires immediate attention. Large deltas can indicate systematic errors, fraud, or data quality issues.';
      suggestedNextStep = 'Review source data immediately and escalate to finance team';
    } else if (severity === 'high') {
      whyItMatters = 'This significant delta suggests a potential issue with data synchronization or accounting accuracy.';
      suggestedNextStep = 'Investigate source and target systems for data quality issues';
    } else {
      whyItMatters = 'This delta may indicate minor synchronization issues or timing differences between systems.';
      suggestedNextStep = 'Monitor trend over next few days';
    }
    
    evidence.push({
      type: 'transaction_id',
      value: `delta_${Math.abs(delta)}`,
      description: `Delta amount: ${delta}`,
    });
  }
  
  // Rule 2: Repeated drift detection
  if (recentHistory && delta !== undefined) {
    const drift = detectRepeatedDrift(delta, recentHistory);
    if (drift) {
      summary = `Repeated drift detected: ${drift.count} occurrences over ${drift.days} days`;
      whyItMatters = `This pattern suggests a systematic issue rather than a one-time error. Cumulative impact is ${drift.totalDelta.toFixed(2)}.`;
      suggestedNextStep = 'Review reconciliation rules and source adapter configuration';
    }
  }
  
  // Rule 3: Compliance breach detection
  const compliance = detectComplianceBreach({ ...event });
  if (compliance.breached) {
    summary = `Compliance issue detected: ${compliance.reason}`;
    whyItMatters = 'This may violate accounting standards or internal policies.';
    suggestedNextStep = 'Review compliance requirements and correct data';
  }
  
  // Rule 4: Event type specific explanations
  if (event.type === 'receipt') {
    if (!summary) {
      summary = 'New receipt processed';
      whyItMatters = 'Receipt data has been extracted and is ready for reconciliation.';
      suggestedNextStep = 'Verify receipt details match source system';
    }
  } else if (event.type === 'reconciliation') {
    if (!summary) {
      summary = 'Reconciliation completed';
      whyItMatters = 'Source and target systems have been compared for accuracy.';
    }
  }
  
  // Default fallback
  if (!summary) {
    summary = `Event detected: ${event.type}`;
    whyItMatters = 'This event may require attention depending on your business context.';
  }
  
  return {
    summary,
    whyItMatters,
    evidence,
    suggestedNextStep,
  };
}

// ============================================================================
// Calculate Impact
// ============================================================================

export function calculateImpact(
  delta?: number,
  currency: string = 'USD',
  sourceReliability: number = 0.75
): Impact {
  let riskScore = 0.5; // Default medium risk
  let confidence = sourceReliability;
  
  if (delta !== undefined) {
    const absDelta = Math.abs(delta);
    const severity = getSeverityFromAmount(absDelta);
    
    // Risk score based on severity
    riskScore = {
      critical: 0.95,
      high: 0.80,
      medium: 0.60,
      low: 0.40,
    }[severity];
    
    // Confidence decreases with larger deltas (more likely to be error)
    if (absDelta > CURRENCY_THRESHOLDS.high) {
      confidence = Math.max(0.5, confidence - 0.1);
    }
  }
  
  return {
    currency: delta !== undefined ? { amount: delta, currency } : undefined,
    riskScore,
    confidence,
  };
}

// ============================================================================
// Calculate Urgency
// ============================================================================

export function calculateUrgency(
  impact: Impact,
  _explanation: Explanation
): 'low' | 'medium' | 'high' | 'critical' {
  // Critical if risk score > 0.9 or currency delta > critical threshold
  if (impact.riskScore > 0.9) return 'critical';
  if (impact.currency && Math.abs(impact.currency.amount) >= CURRENCY_THRESHOLDS.critical) {
    return 'critical';
  }
  
  // High if risk score > 0.7 or currency delta > high threshold
  if (impact.riskScore > 0.7) return 'high';
  if (impact.currency && Math.abs(impact.currency.amount) >= CURRENCY_THRESHOLDS.high) {
    return 'high';
  }
  
  // Medium if risk score > 0.5
  if (impact.riskScore > 0.5) return 'medium';
  
  return 'low';
}
