/**
 * Deterministic Matching Engine
 * 
 * Produces stable, reproducible match results regardless of:
 * - Input ordering
 * - Parallelism/concurrency
 * - Worker scheduling
 * - Random factors
 * 
 * Same inputs + same ruleset → same outputs (bit-for-bit identical)
 */

import { createHash } from 'node:crypto';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../../db';
import { logError, logInfo } from '../../utils/logger';
import {
  CanonicalTransaction,
  CanonicalSettlement,
  computeRecordFingerprint,
  stableStringify,
} from './canonical-input';
import { RunSnapshot } from './run-snapshot';

/**
 * Matching rule configuration
 */
export interface MatchingRule {
  id: string;
  field: string;
  type: 'exact' | 'fuzzy' | 'range' | 'date_range';
  weight: number;
  threshold?: number;
  tolerance?: number;
  days?: number;
  version: number;
}

/**
 * Scoring breakdown for transparency
 */
export interface ScoringBreakdown {
  total_weight: number;
  matched_weight: number;
  field_scores: Record<string, {
    score: number;
    weight: number;
    matched: boolean;
    reason: string;
  }>;
  exact_matches: number;
  fuzzy_matches: number;
  range_matches: number;
}

/**
 * Match rationale (structured, explainable)
 */
export interface MatchRationale {
  primary_match_field: string;
  match_type: 'exact' | 'fuzzy' | 'range' | 'composite';
  confidence_factors: string[];
  warnings: string[];
  data_quality_notes: string[];
}

/**
 * Evidence pointers for audit trail
 */
export interface EvidencePointers {
  left_record_fingerprint: string;
  right_record_fingerprint: string;
  left_record_snapshot_id?: string;
  right_record_snapshot_id?: string;
  matching_rule_ids: string[];
  matching_rule_versions: number[];
}

/**
 * Deterministic match result
 */
export interface DeterministicMatchResult {
  id: string;
  stable_match_id: string;
  snapshot_id: string;
  tenant_id: string;
  
  // Record references
  left_record_id: string;
  left_record_fingerprint: string;
  left_record_source: string;
  
  right_record_id: string;
  right_record_fingerprint: string;
  right_record_source: string;
  
  // Rule information
  rule_id: string | null;
  rule_version: number;
  
  // Confidence scoring
  confidence_score: number;
  scoring_breakdown: ScoringBreakdown;
  
  // Match rationale
  match_rationale: MatchRationale;
  
  // Evidence pointers
  evidence_pointers: EvidencePointers;
  
  // Actor
  actor: 'system' | 'human';
  
  // Timestamp
  matched_at: Date;
}

/**
 * Matching context for deterministic execution
 */
export interface DeterministicMatchingContext {
  snapshot: RunSnapshot;
  source_records: CanonicalTransaction[];
  target_records: CanonicalSettlement[];
  rules: MatchingRule[];
  tenant_id: string;
}

/**
 * Compute stable match ID from deterministic components
 */
export function computeStableMatchId(
  snapshotId: string,
  leftRecordId: string,
  rightRecordId: string,
  ruleId: string | null,
  ruleVersion: number
): string {
  const components = [
    snapshotId,
    leftRecordId,
    rightRecordId,
    ruleId || 'none',
    ruleVersion.toString(),
  ].join(':');
  
  return createHash('sha256').update(components).digest('hex');
}

/**
 * Deterministic Matching Engine
 */
export class DeterministicMatchingEngine {
  private snapshot: RunSnapshot;
  private rules: MatchingRule[];
  private tenantId: string;
  
  // Sorted records for deterministic iteration
  private sortedSourceRecords: CanonicalTransaction[];
  private sortedTargetRecords: CanonicalSettlement[];
  
  // Track matched records
  private matchedSourceIds: Set<string> = new Set();
  private matchedTargetIds: Set<string> = new Set();
  
  // Results
  private matchResults: DeterministicMatchResult[] = [];
  
  constructor(context: DeterministicMatchingContext) {
    this.snapshot = context.snapshot;
    this.rules = this.sortRules(context.rules);
    this.tenantId = context.tenant_id;
    
    // Sort records deterministically
    this.sortedSourceRecords = this.sortRecords(context.source_records);
    this.sortedTargetRecords = this.sortRecords(context.target_records);
  }
  
  /**
   * Execute matching deterministically
   */
  async execute(): Promise<{
    matches: DeterministicMatchResult[];
    unmatched_source: CanonicalTransaction[];
    unmatched_target: CanonicalSettlement[];
  }> {
    const startTime = Date.now();
    
    logInfo('Starting deterministic matching', {
      snapshotId: this.snapshot.id,
      sourceCount: this.sortedSourceRecords.length,
      targetCount: this.sortedTargetRecords.length,
      ruleCount: this.rules.length,
    });
    
    // Phase 1: Exact matching (highest priority)
    await this.executeExactMatching();
    
    // Phase 2: Range matching
    await this.executeRangeMatching();
    
    // Phase 3: Fuzzy matching (lowest priority)
    await this.executeFuzzyMatching();
    
    // Collect unmatched records
    const unmatchedSource = this.sortedSourceRecords.filter(
      r => !this.matchedSourceIds.has(this.getRecordKey(r))
    );
    const unmatchedTarget = this.sortedTargetRecords.filter(
      r => !this.matchedTargetIds.has(this.getRecordKey(r))
    );
    
    const duration = Date.now() - startTime;
    
    logInfo('Deterministic matching complete', {
      snapshotId: this.snapshot.id,
      matchCount: this.matchResults.length,
      unmatchedSourceCount: unmatchedSource.length,
      unmatchedTargetCount: unmatchedTarget.length,
      durationMs: duration,
    });
    
    return {
      matches: this.matchResults,
      unmatched_source: unmatchedSource,
      unmatched_target: unmatchedTarget,
    };
  }
  
  /**
   * Execute exact matching phase
   */
  private async executeExactMatching(): Promise<void> {
    const exactRules = this.rules.filter(r => r.type === 'exact');
    
    for (const rule of exactRules) {
      // Sort rules deterministically by ID
      const sortedRule = this.rules.find(r => r.id === rule.id);
      if (!sortedRule) continue;
      
      for (const source of this.sortedSourceRecords) {
        if (this.matchedSourceIds.has(this.getRecordKey(source))) continue;
        
        for (const target of this.sortedTargetRecords) {
          if (this.matchedTargetIds.has(this.getRecordKey(target))) continue;
          
          const matchResult = this.tryExactMatch(source, target, sortedRule);
          if (matchResult) {
            this.recordMatch(matchResult);
            break; // Move to next source record
          }
        }
      }
    }
  }
  
  /**
   * Execute range matching phase
   */
  private async executeRangeMatching(): Promise<void> {
    const rangeRules = this.rules.filter(r => r.type === 'range' || r.type === 'date_range');
    
    // Sort by rule ID for determinism
    const sortedRangeRules = [...rangeRules].sort((a, b) => a.id.localeCompare(b.id));
    
    for (const rule of sortedRangeRules) {
      for (const source of this.sortedSourceRecords) {
        if (this.matchedSourceIds.has(this.getRecordKey(source))) continue;
        
        // Find all potential matches with scores
        const candidates: { target: CanonicalSettlement; score: number; breakdown: ScoringBreakdown }[] = [];
        
        for (const target of this.sortedTargetRecords) {
          if (this.matchedTargetIds.has(this.getRecordKey(target))) continue;
          
          const result = this.tryRangeMatch(source, target, rule);
          if (result) {
            candidates.push(result);
          }
        }
        
        // Sort candidates deterministically by score, then by record ID for tie-breaking
        candidates.sort((a, b) => {
          const scoreDiff = b.score - a.score;
          if (Math.abs(scoreDiff) > 0.0001) return scoreDiff;
          // Tie-break by target record ID
          return a.target.external_id.localeCompare(b.target.external_id);
        });
        
        // Take best match if above threshold
        if (candidates.length > 0 && candidates[0]!.score >= (rule.threshold || 0.8)) {
          const best = candidates[0]!;
          const matchResult = this.createMatchResult(source, best.target, rule, best.score, best.breakdown);
          this.recordMatch(matchResult);
        }
      }
    }
  }
  
  /**
   * Execute fuzzy matching phase
   */
  private async executeFuzzyMatching(): Promise<void> {
    const fuzzyRules = this.rules.filter(r => r.type === 'fuzzy');
    
    // Sort by rule ID for determinism
    const sortedFuzzyRules = [...fuzzyRules].sort((a, b) => a.id.localeCompare(b.id));
    
    for (const rule of sortedFuzzyRules) {
      for (const source of this.sortedSourceRecords) {
        if (this.matchedSourceIds.has(this.getRecordKey(source))) continue;
        
        const candidates: { target: CanonicalSettlement; score: number; breakdown: ScoringBreakdown }[] = [];
        
        for (const target of this.sortedTargetRecords) {
          if (this.matchedTargetIds.has(this.getRecordKey(target))) continue;
          
          const result = this.tryFuzzyMatch(source, target, rule);
          if (result) {
            candidates.push(result);
          }
        }
        
        // Sort candidates deterministically
        candidates.sort((a, b) => {
          const scoreDiff = b.score - a.score;
          if (Math.abs(scoreDiff) > 0.0001) return scoreDiff;
          return a.target.external_id.localeCompare(b.target.external_id);
        });
        
        if (candidates.length > 0 && candidates[0]!.score >= (rule.threshold || 0.8)) {
          const best = candidates[0]!;
          const matchResult = this.createMatchResult(source, best.target, rule, best.score, best.breakdown);
          this.recordMatch(matchResult);
        }
      }
    }
  }
  
  /**
   * Try exact match between records
   */
  private tryExactMatch(
    source: CanonicalTransaction,
    target: CanonicalSettlement,
    rule: MatchingRule
  ): DeterministicMatchResult | null {
    const sourceValue = this.getFieldValue(source, rule.field);
    const targetValue = this.getFieldValue(target, rule.field);
    
    if (sourceValue === undefined || targetValue === undefined) return null;
    
    if (sourceValue === targetValue) {
      const breakdown = this.createScoringBreakdown(rule, 1.0, true, 'Exact match');
      return this.createMatchResult(source, target, rule, 1.0, breakdown);
    }
    
    return null;
  }
  
  /**
   * Try range match between records
   */
  private tryRangeMatch(
    source: CanonicalTransaction,
    target: CanonicalSettlement,
    rule: MatchingRule
  ): { target: CanonicalSettlement; score: number; breakdown: ScoringBreakdown } | null {
    const sourceValue = this.getFieldValue(source, rule.field);
    const targetValue = this.getFieldValue(target, rule.field);
    
    if (sourceValue === undefined || targetValue === undefined) return null;
    
    if (rule.type === 'range' && typeof sourceValue === 'number' && typeof targetValue === 'number') {
      const diff = Math.abs(sourceValue - targetValue);
      const tolerance = rule.tolerance || 0.01;
      
      if (diff <= tolerance) {
        const score = 1.0 - (diff / tolerance);
        const breakdown = this.createScoringBreakdown(rule, score, true, `Within tolerance: diff=${diff.toFixed(4)}`);
        return { target, score, breakdown };
      }
    }
    
    if (rule.type === 'date_range') {
      const sourceDate = new Date(sourceValue as string);
      const targetDate = new Date(targetValue as string);
      
      if (!isNaN(sourceDate.getTime()) && !isNaN(targetDate.getTime())) {
        const diffDays = Math.abs((sourceDate.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24));
        const maxDays = rule.days || 7;
        
        if (diffDays <= maxDays) {
          const score = 1.0 - (diffDays / maxDays);
          const breakdown = this.createScoringBreakdown(rule, score, true, `Within date range: diff=${diffDays.toFixed(1)} days`);
          return { target, score, breakdown };
        }
      }
    }
    
    return null;
  }
  
  /**
   * Try fuzzy match between records
   */
  private tryFuzzyMatch(
    source: CanonicalTransaction,
    target: CanonicalSettlement,
    rule: MatchingRule
  ): { target: CanonicalSettlement; score: number; breakdown: ScoringBreakdown } | null {
    const sourceValue = this.getFieldValue(source, rule.field);
    const targetValue = this.getFieldValue(target, rule.field);
    
    if (sourceValue === undefined || targetValue === undefined) return null;
    
    if (typeof sourceValue === 'string' && typeof targetValue === 'string') {
      const similarity = this.calculateStringSimilarity(sourceValue, targetValue);
      const threshold = rule.threshold || 0.8;
      
      if (similarity >= threshold) {
        const breakdown = this.createScoringBreakdown(rule, similarity, true, `Fuzzy match: similarity=${similarity.toFixed(3)}`);
        return { target, score: similarity, breakdown };
      }
    }
    
    return null;
  }
  
  /**
   * Create a match result
   */
  private createMatchResult(
    source: CanonicalTransaction,
    target: CanonicalSettlement,
    rule: MatchingRule,
    score: number,
    breakdown: ScoringBreakdown
  ): DeterministicMatchResult {
    const sourceFingerprint = computeRecordFingerprint(source);
    const targetFingerprint = computeRecordFingerprint(target);
    const stableMatchId = computeStableMatchId(
      this.snapshot.id,
      source.external_id,
      target.external_id,
      rule.id,
      rule.version
    );
    
    const rationale: MatchRationale = {
      primary_match_field: rule.field,
      match_type: rule.type === 'exact' ? 'exact' : rule.type === 'fuzzy' ? 'fuzzy' : 'range',
      confidence_factors: this.extractConfidenceFactors(breakdown),
      warnings: this.extractWarnings(source, target, score),
      data_quality_notes: this.extractDataQualityNotes(source, target),
    };
    
    const evidencePointers: EvidencePointers = {
      left_record_fingerprint: sourceFingerprint,
      right_record_fingerprint: targetFingerprint,
      matching_rule_ids: [rule.id],
      matching_rule_versions: [rule.version],
    };
    
    return {
      id: uuidv4(),
      stable_match_id: stableMatchId,
      snapshot_id: this.snapshot.id,
      tenant_id: this.tenantId,
      left_record_id: source.external_id,
      left_record_fingerprint: sourceFingerprint,
      left_record_source: source.source,
      right_record_id: target.external_id,
      right_record_fingerprint: targetFingerprint,
      right_record_source: target.source,
      rule_id: rule.id,
      rule_version: rule.version,
      confidence_score: score,
      scoring_breakdown: breakdown,
      match_rationale: rationale,
      evidence_pointers: evidencePointers,
      actor: 'system',
      matched_at: new Date(),
    };
  }
  
  /**
   * Record a match and mark records as matched
   */
  private recordMatch(match: DeterministicMatchResult): void {
    this.matchResults.push(match);
    this.matchedSourceIds.add(match.left_record_id);
    this.matchedTargetIds.add(match.right_record_id);
  }
  
  /**
   * Get field value from record
   */
  private getFieldValue(record: CanonicalTransaction | CanonicalSettlement, field: string): unknown {
    switch (field) {
      case 'external_id':
      case 'id':
        return record.external_id;
      case 'amount':
        return parseFloat(record.amount);
      case 'currency':
        return record.currency;
      case 'date':
        return record.date;
      case 'source':
        return record.source;
      case 'account':
        return record.account;
      case 'description':
        return record.description;
      default:
        return record.metadata?.[field];
    }
  }
  
  /**
   * Calculate string similarity (Levenshtein distance)
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }
  
  /**
   * Calculate Levenshtein distance
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      if (!matrix[0]) matrix[0] = [];
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i]![j] = matrix[i - 1]![j - 1]!;
        } else {
          matrix[i]![j] = Math.min(
            matrix[i - 1]![j - 1]! + 1,
            matrix[i]![j - 1]! + 1,
            matrix[i - 1]![j]! + 1
          );
        }
      }
    }
    
    return matrix[str2.length]![str1.length]!;
  }
  
  /**
   * Sort rules deterministically
   */
  private sortRules(rules: MatchingRule[]): MatchingRule[] {
    return [...rules].sort((a, b) => {
      // Sort by type priority: exact > range > fuzzy
      const typePriority = { exact: 0, range: 1, date_range: 2, fuzzy: 3 };
      const typeDiff = (typePriority[a.type] || 99) - (typePriority[b.type] || 99);
      if (typeDiff !== 0) return typeDiff;
      
      // Then by weight (higher first)
      const weightDiff = b.weight - a.weight;
      if (Math.abs(weightDiff) > 0.0001) return weightDiff;
      
      // Then by ID for determinism
      return a.id.localeCompare(b.id);
    });
  }
  
  /**
   * Sort records deterministically
   */
  private sortRecords<T extends CanonicalTransaction | CanonicalSettlement>(records: T[]): T[] {
    return [...records].sort((a, b) => {
      // Sort by: source, external_id, date, amount, currency
      const sourceCompare = a.source.localeCompare(b.source);
      if (sourceCompare !== 0) return sourceCompare;
      
      const externalIdCompare = a.external_id.localeCompare(b.external_id);
      if (externalIdCompare !== 0) return externalIdCompare;
      
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      
      const amountCompare = a.amount.localeCompare(b.amount);
      if (amountCompare !== 0) return amountCompare;
      
      return a.currency.localeCompare(b.currency);
    });
  }
  
  /**
   * Get record key for tracking
   */
  private getRecordKey(record: CanonicalTransaction | CanonicalSettlement): string {
    return `${record.source}:${record.external_id}`;
  }
  
  /**
   * Create scoring breakdown
   */
  private createScoringBreakdown(
    rule: MatchingRule,
    score: number,
    matched: boolean,
    reason: string
  ): ScoringBreakdown {
    return {
      total_weight: rule.weight,
      matched_weight: matched ? rule.weight : 0,
      field_scores: {
        [rule.field]: {
          score,
          weight: rule.weight,
          matched,
          reason,
        },
      },
      exact_matches: rule.type === 'exact' && matched ? 1 : 0,
      fuzzy_matches: rule.type === 'fuzzy' && matched ? 1 : 0,
      range_matches: (rule.type === 'range' || rule.type === 'date_range') && matched ? 1 : 0,
    };
  }
  
  /**
   * Extract confidence factors from scoring breakdown
   */
  private extractConfidenceFactors(breakdown: ScoringBreakdown): string[] {
    const factors: string[] = [];
    
    if (breakdown.exact_matches > 0) {
      factors.push(`${breakdown.exact_matches} exact field match(es)`);
    }
    if (breakdown.range_matches > 0) {
      factors.push(`${breakdown.range_matches} range match(es) within tolerance`);
    }
    if (breakdown.fuzzy_matches > 0) {
      factors.push(`${breakdown.fuzzy_matches} fuzzy match(es) above threshold`);
    }
    
    return factors;
  }
  
  /**
   * Extract warnings from match
   */
  private extractWarnings(
    source: CanonicalTransaction,
    target: CanonicalSettlement,
    score: number
  ): string[] {
    const warnings: string[] = [];
    
    if (score < 0.95) {
      warnings.push(`Confidence below 95%: ${(score * 100).toFixed(1)}%`);
    }
    
    if (source.currency !== target.currency) {
      warnings.push(`Currency mismatch: ${source.currency} vs ${target.currency}`);
    }
    
    return warnings;
  }
  
  /**
   * Extract data quality notes
   */
  private extractDataQualityNotes(
    source: CanonicalTransaction,
    target: CanonicalSettlement
  ): string[] {
    const notes: string[] = [];
    
    if (!source.description && !target.description) {
      notes.push('Both records lack description');
    }
    
    if (!source.account || !target.account) {
      notes.push('Missing account information');
    }
    
    return notes;
  }
}

/**
 * Persist match results to database
 */
export async function persistMatchResults(
  matches: DeterministicMatchResult[]
): Promise<void> {
  if (matches.length === 0) return;
  
  try {
    for (const match of matches) {
      await query(
        `INSERT INTO deterministic_match_results (
          id, tenant_id, snapshot_id, stable_match_id,
          left_record_id, left_record_fingerprint, left_record_source,
          right_record_id, right_record_fingerprint, right_record_source,
          rule_id, rule_version, confidence_score, scoring_breakdown,
          match_rationale, evidence_pointers, actor, matched_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        ON CONFLICT (stable_match_id) DO NOTHING`,
        [
          match.id,
          match.tenant_id,
          match.snapshot_id,
          match.stable_match_id,
          match.left_record_id,
          match.left_record_fingerprint,
          match.left_record_source,
          match.right_record_id,
          match.right_record_fingerprint,
          match.right_record_source,
          match.rule_id,
          match.rule_version,
          match.confidence_score,
          stableStringify(match.scoring_breakdown),
          stableStringify(match.match_rationale),
          stableStringify(match.evidence_pointers),
          match.actor,
          match.matched_at,
        ]
      );
    }
    
    logInfo('Persisted match results', { count: matches.length });
  } catch (error) {
    logError('Failed to persist match results', error);
    throw error;
  }
}
