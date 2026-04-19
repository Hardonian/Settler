/**
 * LegalTech Module - Contract Diff Service
 *
 * Part of Phase IV: Vertical Modules
 */

import { PrismaClient } from "@prisma/client";
import { logInfo } from "../../../utils/logger";

export interface ContractDiff {
  added: string[];
  removed: string[];
  modified: Array<{
    clause: string;
    before: string;
    after: string;
  }>;
  riskScore: number;
}

interface Obligation {
  party: string;
  obligation: string;
  deadline?: string;
  penalty?: string;
  [key: string]: unknown;
}

export class ContractDiffService {
  private _prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this._prisma = prisma;
    // Reserved for future database operations
    void this._prisma;
  }

  /**
   * Compare two contract versions
   */
  async diffContracts(
    tenantId: string,
    contract1: string,
    contract2: string
  ): Promise<ContractDiff> {
    // Tokenize contracts into clauses/sentences
    const clauses1 = this.tokenizeContract(contract1);
    const clauses2 = this.tokenizeContract(contract2);

    const added: string[] = [];
    const removed: string[] = [];
    const modified: Array<{ clause: string; before: string; after: string }> = [];

    // Find added and modified clauses
    for (const clause2 of clauses2) {
      const normalizedClause2 = this.normalizeClause(clause2);
      const match = clauses1.find(c => this.normalizeClause(c) === normalizedClause2);
      
      if (!match) {
        // Check if it's a modification of an existing clause
        const similar = this.findSimilarClause(normalizedClause2, clauses1);
        if (similar) {
          modified.push({
            clause: this.extractClauseHeading(clause2) || normalizedClause2.substring(0, 50),
            before: similar,
            after: clause2,
          });
        } else {
          added.push(clause2);
        }
      }
    }

    // Find removed clauses
    for (const clause1 of clauses1) {
      const normalizedClause1 = this.normalizeClause(clause1);
      const exists = clauses2.some(c => this.normalizeClause(c) === normalizedClause1);
      if (!exists) {
        removed.push(clause1);
      }
    }

    // Calculate risk score based on changes
    const riskScore = this.calculateRiskScore(added, removed, modified);

    logInfo("Contract diff generated", { tenantId, added: added.length, removed: removed.length, modified: modified.length, riskScore });

    return { added, removed, modified, riskScore };
  }

  /**
   * Tokenize contract into clauses
   */
  private tokenizeContract(contract: string): string[] {
    // Split by numbered sections, paragraphs, or sentence boundaries
    const clauses = contract
      .split(/(?:\d+\.)|(?:\n\n)|(?:;[\s])/)
      .map(c => c.trim())
      .filter(c => c.length > 20); // Filter out short fragments
    return clauses;
  }

  /**
   * Normalize clause for comparison
   */
  private normalizeClause(clause: string): string {
    return clause
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s]/g, '')
      .trim();
  }

  /**
   * Find similar clause using simple matching
   */
  private findSimilarClause(clause: string, clauses: string[]): string | null {
    const clauseWords = new Set(clause.split(' '));
    
    let bestMatch: string | null = null;
    let bestScore = 0;

    for (const c of clauses) {
      const cWords = new Set(this.normalizeClause(c).split(' '));
      const intersection = [...clauseWords].filter(w => cWords.has(w));
      const score = intersection.length / Math.max(clauseWords.size, cWords.size);
      
      if (score > 0.6 && score > bestScore) {
        bestScore = score;
        bestMatch = c;
      }
    }

    return bestMatch;
  }

  /**
   * Extract clause heading/section
   */
  private extractClauseHeading(clause: string): string {
    const match = clause.match(/^([A-Z][^:]+):?/);
    return match && match[1] ? match[1].trim() : clause.substring(0, 50);
  }

  /**
   * Calculate risk score based on changes
   */
  private calculateRiskScore(added: string[], removed: string[], modified: Array<{ before: string; after: string }>): number {
    let score = 0;

    // High-risk keywords that increase risk
    const riskKeywords = ['indemnif', 'liability', 'penalty', 'terminate', 'breach', 'warrant', 'guarantee'];
    const riskPatterns = riskKeywords.map(k => new RegExp(k, 'i'));

    for (const clause of added) {
      if (riskPatterns.some(p => p.test(clause))) {
        score += 15;
      } else {
        score += 5;
      }
    }

    score += removed.length * 10; // Removing protections is risky

    for (const mod of modified) {
      if (riskPatterns.some(p => p.test(mod.after))) {
        score += 20; // Modifications to risk clauses are high risk
      } else {
        score += 8;
      }
    }

    return Math.min(100, score);
  }

  /**
   * Extract obligations from contract
   */
  async extractObligations(contract: string): Promise<Obligation[]> {
    const obligations: Obligation[] = [];
    const lines = contract.split('\n').filter(l => l.trim());

    // Patterns for identifying obligations
    const obligationPatterns = [
      { regex: /shall\s+(.+?)(?:\.|$)/gi, party: 'Party A' },
      { regex: /must\s+(.+?)(?:\.|$)/gi, party: 'Party A' },
      { regex: /agrees?\s+to\s+(.+?)(?:\.|$)/gi, party: 'Party A' },
      { regex: /(?:party\s+b|the\s+(?:provider|vendor|contractor))\s+(?:shall|must|agrees?)\s+(.+?)(?:\.|$)/gi, party: 'Party B' },
    ];

    // Patterns for deadlines
    const deadlinePattern = /(?:within|by|on|before)\s+(\d+\s+(?:days?|weeks?|months?)|\d{4}-\d{2}-\d{2})/gi;

    // Patterns for penalties
    const penaltyPattern = /(?:penalty|fine|damages?|indemnify)\s+(?:of|up\s+to)?\s*\$?([\d,]+)/gi;

    for (const line of lines) {
      for (const { regex, party } of obligationPatterns) {
        let match;
        regex.lastIndex = 0;
        while ((match = regex.exec(line)) !== null) {
          const obligation = (match[1] || "").trim();
          
          // Extract deadline
          const deadlineMatch = line.match(deadlinePattern);
          const deadline = deadlineMatch ? deadlineMatch[1] : undefined;

          // Extract penalty
          const penaltyMatch = line.match(penaltyPattern);
          const penalty = penaltyMatch && penaltyMatch[1] ? `$${penaltyMatch[1]}` : undefined;

          if (obligation.length > 10) {
            obligations.push({
              party,
              obligation,
              deadline,
              penalty,
              sourceLine: line.substring(0, 100),
            });
          }
        }
      }
    }

    return obligations;
  }

  /**
   * Map obligations between contracts
   */
  async mapObligations(
    _sourceObligations: unknown[],
    _targetObligations: unknown[]
  ): Promise<
    Array<{
      source: Obligation;
      target: Obligation;
      confidence: number;
    }>
  > {
    // Use reconciliation engine to map obligations
    return [];
  }
}
