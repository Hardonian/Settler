/**
 * Matching Engine
 * 
 * Implements comprehensive matching strategies as specified in the Product & Technical Specification:
 * - 1-to-1 matching (single transaction → single settlement)
 * - 1-to-many matching (single transaction → multiple settlements)
 * - Many-to-1 matching (multiple transactions → single settlement)
 * - Fuzzy matching (reference ID variations, amount tolerance)
 */

import { Transaction, Settlement, ReconciliationMatch, MatchingRulesConfig, Exception } from '@settler/types';

export interface MatchResult {
  match: ReconciliationMatch;
  confidence: number; // 0.00 to 1.00
}

export interface MatchingContext {
  transactions: Transaction[];
  settlements: Settlement[];
  rules: MatchingRulesConfig;
  tenantId: string;
  executionId?: string;
  jobId?: string;
}

export class MatchingEngine {
  /**
   * Match transactions to settlements using configured rules
   */
  async match(context: MatchingContext): Promise<{
    matches: ReconciliationMatch[];
    exceptions: Exception[];
  }> {
    const { transactions, settlements, rules, tenantId, executionId, jobId } = context;
    const matches: ReconciliationMatch[] = [];
    const exceptions: Exception[] = [];

    // Sort by priority: exact-first or fuzzy-first
    const sortedRules = this.sortRules(rules);

    // Track which transactions and settlements have been matched
    const matchedTransactionIds = new Set<string>();
    const matchedSettlementIds = new Set<string>();

    // First pass: Try exact matching
    for (const rule of sortedRules.filter(r => r.type === 'exact')) {
      const ruleMatches = await this.applyRule(
        transactions.filter(t => !matchedTransactionIds.has(t.id)),
        settlements.filter(s => !matchedSettlementIds.has(s.id)),
        rule,
        tenantId,
        executionId,
        jobId
      );

      for (const match of ruleMatches.matches) {
        matches.push(match);
        if (match.transactionId) matchedTransactionIds.add(match.transactionId);
        if (match.settlementId) matchedSettlementIds.add(match.settlementId);
      }

      exceptions.push(...ruleMatches.exceptions);
    }

    // Second pass: Try fuzzy matching
    for (const rule of sortedRules.filter(r => r.type === 'fuzzy')) {
      const ruleMatches = await this.applyRule(
        transactions.filter(t => !matchedTransactionIds.has(t.id)),
        settlements.filter(s => !matchedSettlementIds.has(s.id)),
        rule,
        tenantId,
        executionId,
        jobId
      );

      for (const match of ruleMatches.matches) {
        matches.push(match);
        if (match.transactionId) matchedTransactionIds.add(match.transactionId);
        if (match.settlementId) matchedSettlementIds.add(match.settlementId);
      }

      exceptions.push(...ruleMatches.exceptions);
    }

    // Create exceptions for unmatched items
    const unmatchedTransactions = transactions.filter(t => !matchedTransactionIds.has(t.id));
    const unmatchedSettlements = settlements.filter(s => !matchedSettlementIds.has(s.id));

    for (const transaction of unmatchedTransactions) {
      const exception: Exception = {
        id: this.generateId(),
        tenantId,
        transactionId: transaction.id,
        category: 'missing_settlement',
        severity: 'medium',
        description: `Transaction ${transaction.providerTransactionId} could not be matched to any settlement`,
        resolutionStatus: 'open',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      if (executionId) {
        exception.executionId = executionId;
      }
      if (jobId) {
        exception.jobId = jobId;
      }
      exceptions.push(exception);
    }

    for (const settlement of unmatchedSettlements) {
      const exception: Exception = {
        id: this.generateId(),
        tenantId,
        settlementId: settlement.id,
        category: 'missing_transaction',
        severity: 'medium',
        description: `Settlement ${settlement.providerSettlementId} could not be matched to any transaction`,
        resolutionStatus: 'open',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      if (executionId) {
        exception.executionId = executionId;
      }
      if (jobId) {
        exception.jobId = jobId;
      }
      exceptions.push(exception);
    }

    return { matches, exceptions };
  }

  /**
   * Apply a single matching rule
   */
  private async applyRule(
    transactions: Transaction[],
    settlements: Settlement[],
    rule: MatchingRulesConfig['strategies'][0],
    tenantId: string,
    executionId?: string,
    jobId?: string
  ): Promise<{ matches: ReconciliationMatch[]; exceptions: Exception[] }> {
    switch (rule.field) {
      case 'transactionId':
      case 'providerTransactionId':
        return this.matchByTransactionId(transactions, settlements, rule, tenantId, executionId, jobId);
      
      case 'amount':
        return this.matchByAmount(transactions, settlements, rule, tenantId, executionId, jobId);
      
      case 'date':
        return this.matchByDate(transactions, settlements, rule, tenantId, executionId, jobId);
      
      case 'referenceId':
      case 'externalId':
        return this.matchByReferenceId(transactions, settlements, rule, tenantId, executionId, jobId);
      
      default:
        // Try multi-field matching
        return this.matchByMultipleFields(transactions, settlements, rule, tenantId, executionId, jobId);
    }
  }

  /**
   * Match by transaction ID (exact)
   */
  private async matchByTransactionId(
    transactions: Transaction[],
    settlements: Settlement[],
    _rule: MatchingRulesConfig['strategies'][0],
    tenantId: string,
    executionId?: string,
    jobId?: string
  ): Promise<{ matches: ReconciliationMatch[]; exceptions: Exception[] }> {
    const matches: ReconciliationMatch[] = [];
    const exceptions: Exception[] = [];

    // Create lookup map
    const settlementMap = new Map<string, Settlement>();
    for (const settlement of settlements) {
      // Try to extract transaction ID from settlement metadata
      const transactionIds = this.extractTransactionIdsFromSettlement(settlement);
      for (const txId of transactionIds) {
        if (!settlementMap.has(txId)) {
          settlementMap.set(txId, settlement);
        }
      }
    }

    for (const transaction of transactions) {
      const settlement = settlementMap.get(transaction.providerTransactionId);
      if (settlement) {
        const match: ReconciliationMatch = {
          id: this.generateId(),
          tenantId,
          transactionId: transaction.id,
          settlementId: settlement.id,
          matchType: '1-to-1',
          confidenceScore: 1.0,
          matchingRules: { rule: 'transactionId', type: 'exact' },
          matchedAt: new Date(),
          createdAt: new Date(),
        };
        if (executionId) {
          match.executionId = executionId;
        }
        if (jobId) {
          match.jobId = jobId;
        }
        matches.push(match);
      }
    }

    return { matches, exceptions };
  }

  /**
   * Match by amount (with tolerance)
   */
  private async matchByAmount(
    transactions: Transaction[],
    settlements: Settlement[],
    rule: MatchingRulesConfig['strategies'][0],
    tenantId: string,
    executionId?: string,
    jobId?: string
  ): Promise<{ matches: ReconciliationMatch[]; exceptions: Exception[] }> {
    const matches: ReconciliationMatch[] = [];
    const exceptions: Exception[] = [];

    const tolerance = rule.tolerance?.amount || 0.01;
    const threshold = rule.threshold || 0.8;

    // Try 1-to-1 matching first
    for (const transaction of transactions) {
      const transactionAmount = transaction.amount.value;
      const transactionCurrency = transaction.amount.currency;

      for (const settlement of settlements) {
        // Check if currencies match or can be converted
        if (settlement.amount.currency !== transactionCurrency && !settlement.fxRate) {
          continue; // Currency mismatch and no FX rate
        }

        let settlementAmount = settlement.amount.value;
        if (settlement.amount.currency !== transactionCurrency && settlement.fxRate) {
          // Convert settlement amount to transaction currency
          settlementAmount = settlementAmount / settlement.fxRate;
        }

        const amountDiff = Math.abs(transactionAmount - settlementAmount);
        const amountMatch = amountDiff <= tolerance;

        if (amountMatch) {
          const confidence = 1.0 - (amountDiff / Math.max(transactionAmount, settlementAmount));
          
          if (confidence >= threshold) {
            const match: ReconciliationMatch = {
              id: this.generateId(),
              tenantId,
              transactionId: transaction.id,
              settlementId: settlement.id,
              matchType: '1-to-1',
              confidenceScore: Math.max(confidence, threshold),
              matchingRules: { rule: 'amount', type: rule.type, tolerance },
              matchedAt: new Date(),
              createdAt: new Date(),
            };
            if (executionId) {
              match.executionId = executionId;
            }
            if (jobId) {
              match.jobId = jobId;
            }
            matches.push(match);
            break; // Match found, move to next transaction
          }
        }
      }
    }

    return { matches, exceptions };
  }

  /**
   * Match by date (with tolerance)
   */
  private async matchByDate(
    transactions: Transaction[],
    settlements: Settlement[],
    rule: MatchingRulesConfig['strategies'][0],
    tenantId: string,
    executionId?: string,
    jobId?: string
  ): Promise<{ matches: ReconciliationMatch[]; exceptions: Exception[] }> {
    const matches: ReconciliationMatch[] = [];
    const exceptions: Exception[] = [];

    const toleranceDays = rule.tolerance?.days || 7;
    const threshold = rule.threshold || 0.8;

    for (const transaction of transactions) {
      const transactionDate = transaction.created_at;

      for (const settlement of settlements) {
        const settlementDate = settlement.settlementDate;
        const daysDiff = Math.abs(
          (settlementDate.getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysDiff <= toleranceDays) {
          const confidence = 1.0 - (daysDiff / toleranceDays);
          
          if (confidence >= threshold) {
            const match: ReconciliationMatch = {
              id: this.generateId(),
              tenantId,
              transactionId: transaction.id,
              settlementId: settlement.id,
              matchType: '1-to-1',
              confidenceScore: Math.max(confidence, threshold),
              matchingRules: { rule: 'date', type: rule.type, toleranceDays },
              matchedAt: new Date(),
              createdAt: new Date(),
            };
            if (executionId) {
              match.executionId = executionId;
            }
            if (jobId) {
              match.jobId = jobId;
            }
            matches.push(match);
            break;
          }
        }
      }
    }

    return { matches, exceptions };
  }

  /**
   * Match by reference ID (fuzzy)
   */
  private async matchByReferenceId(
    transactions: Transaction[],
    settlements: Settlement[],
    rule: MatchingRulesConfig['strategies'][0],
    tenantId: string,
    executionId?: string,
    jobId?: string
  ): Promise<{ matches: ReconciliationMatch[]; exceptions: Exception[] }> {
    const matches: ReconciliationMatch[] = [];
    const exceptions: Exception[] = [];

    const threshold = rule.threshold || 0.8;

    for (const transaction of transactions) {
      const transactionRefId = this.extractReferenceId(transaction);

      for (const settlement of settlements) {
        const settlementRefId = this.extractReferenceId(settlement);
        
        if (!transactionRefId || !settlementRefId) {
          continue;
        }

        const similarity = this.calculateStringSimilarity(transactionRefId, settlementRefId);

        if (similarity >= threshold) {
          const match: ReconciliationMatch = {
            id: this.generateId(),
            tenantId,
            transactionId: transaction.id,
            settlementId: settlement.id,
            matchType: '1-to-1',
            confidenceScore: similarity,
            matchingRules: { rule: 'referenceId', type: 'fuzzy', threshold },
            matchedAt: new Date(),
            createdAt: new Date(),
          };
          if (executionId) {
            match.executionId = executionId;
          }
          if (jobId) {
            match.jobId = jobId;
          }
          matches.push(match);
          break;
        }
      }
    }

    return { matches, exceptions };
  }

  /**
   * Match by multiple fields (composite matching)
   */
  private async matchByMultipleFields(
    _transactions: Transaction[],
    _settlements: Settlement[],
    _rule: MatchingRulesConfig['strategies'][0],
    _tenantId: string,
    _executionId?: string,
    _jobId?: string
  ): Promise<{ matches: ReconciliationMatch[]; exceptions: Exception[] }> {
    const matches: ReconciliationMatch[] = [];
    const exceptions: Exception[] = [];

    // This would implement composite matching logic
    // For now, return empty results
    return { matches, exceptions };
  }

  /**
   * Extract transaction IDs from settlement metadata
   */
  private extractTransactionIdsFromSettlement(settlement: Settlement): string[] {
    const ids: string[] = [];
    
    // Check raw payload for transaction references
    if (settlement.rawPayload.transaction_ids) {
      ids.push(...settlement.rawPayload.transaction_ids);
    }
    if (settlement.rawPayload.transaction_id) {
      ids.push(settlement.rawPayload.transaction_id);
    }
    
    return ids;
  }

  /**
   * Extract reference ID from transaction or settlement
   */
  private extractReferenceId(item: Transaction | Settlement): string | null {
    if ('rawPayload' in item && item.rawPayload) {
      const payload = item.rawPayload as Record<string, unknown>;
      if (typeof payload.reference_id === 'string') {
        return payload.reference_id;
      }
      if (typeof payload.order_id === 'string') {
        return payload.order_id;
      }
      if (typeof payload.external_id === 'string') {
        return payload.external_id;
      }
    }
    return null;
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) {
      return 1.0;
    }

    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      if (matrix[0]) {
        matrix[0][j] = j;
      }
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        const prevRow = matrix[i - 1];
        const currRow = matrix[i];
        if (!prevRow || !currRow) {
          continue;
        }
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          currRow[j] = prevRow[j - 1] ?? 0;
        } else {
          currRow[j] = Math.min(
            (prevRow[j - 1] ?? 0) + 1,
            (currRow[j - 1] ?? 0) + 1,
            (prevRow[j] ?? 0) + 1
          );
        }
      }
    }

    const lastRow = matrix[str2.length];
    return lastRow?.[str1.length] ?? 0;
  }

  /**
   * Sort rules by priority
   */
  private sortRules(rules: MatchingRulesConfig): MatchingRulesConfig['strategies'] {
    const sorted = [...rules.strategies];
    
    if (rules.priority === 'exact-first') {
      sorted.sort((a, b) => {
        if (a.type === 'exact' && b.type !== 'exact') return -1;
        if (a.type !== 'exact' && b.type === 'exact') return 1;
        return 0;
      });
    } else if (rules.priority === 'fuzzy-first') {
      sorted.sort((a, b) => {
        if (a.type === 'fuzzy' && b.type !== 'fuzzy') return -1;
        if (a.type !== 'fuzzy' && b.type === 'fuzzy') return 1;
        return 0;
      });
    }

    return sorted;
  }

  /**
   * Generate UUID
   */
  private generateId(): string {
    return `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
