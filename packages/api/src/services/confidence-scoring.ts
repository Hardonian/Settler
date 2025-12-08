/**
 * Confidence Scoring Service
 * E2: Matching engine improvements - Confidence scoring algorithm
 */

import { MatchingRule } from "../domain/entities/Job";

export interface MatchCandidate {
  sourceId: string;
  targetId: string;
  sourceData: Record<string, unknown>;
  targetData: Record<string, unknown>;
  rules: MatchingRule[];
}

export interface ConfidenceScore {
  score: number; // 0-1
  breakdown: Array<{
    rule: MatchingRule;
    score: number;
    reason: string;
  }>;
  factors: {
    exactMatches: number;
    fuzzyMatches: number;
    rangeMatches: number;
    totalRules: number;
  };
}

/**
 * Calculate confidence score for a match
 * @param candidate - Match candidate with source and target data
 * @param rules - Matching rules to apply
 * @returns Confidence score (0-1) with breakdown
 */
export function calculateConfidenceScore(
  candidate: MatchCandidate,
  rules: MatchingRule[]
): ConfidenceScore {
  const breakdown: Array<{
    rule: MatchingRule;
    score: number;
    reason: string;
  }> = [];

  let totalScore = 0;
  let exactMatches = 0;
  let fuzzyMatches = 0;
  let rangeMatches = 0;

  for (const rule of rules) {
    const sourceValue = candidate.sourceData[rule.field];
    const targetValue = candidate.targetData[rule.field];

    if (sourceValue === undefined || targetValue === undefined) {
      breakdown.push({
        rule,
        score: 0,
        reason: `Field '${rule.field}' missing in source or target`,
      });
      continue;
    }

    let score = 0;
    let reason = "";

    switch (rule.type) {
      case "exact":
        if (rule.field === "amount" && rule.tolerance !== undefined) {
          const sourceAmount = parseFloat(String(sourceValue));
          const targetAmount = parseFloat(String(targetValue));
          const diff = Math.abs(sourceAmount - targetAmount);
          if (diff <= rule.tolerance) {
            score = 1.0;
            reason = `Amounts match within tolerance (${diff} <= ${rule.tolerance})`;
            exactMatches++;
          } else {
            score = Math.max(0, 1 - diff / (rule.tolerance * 10)); // Penalize larger differences
            reason = `Amounts differ by ${diff} (tolerance: ${rule.tolerance})`;
          }
        } else {
          if (sourceValue === targetValue) {
            score = 1.0;
            reason = `Exact match: ${sourceValue} === ${targetValue}`;
            exactMatches++;
          } else {
            score = 0;
            reason = `No exact match: ${sourceValue} !== ${targetValue}`;
          }
        }
        break;

      case "fuzzy":
        const similarity = calculateSimilarity(String(sourceValue), String(targetValue));
        const threshold = rule.threshold || 0.8;
        if (similarity >= threshold) {
          score = similarity;
          reason = `Fuzzy match: similarity ${similarity.toFixed(2)} >= threshold ${threshold}`;
          fuzzyMatches++;
        } else {
          score = similarity * 0.5; // Partial credit for close matches
          reason = `Fuzzy match below threshold: similarity ${similarity.toFixed(2)} < ${threshold}`;
        }
        break;

      case "range":
        if (rule.days !== undefined && rule.field.includes("date")) {
          const sourceDate = new Date(String(sourceValue));
          const targetDate = new Date(String(targetValue));
          const diffDays = Math.abs((sourceDate.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays <= rule.days) {
            score = 1 - (diffDays / rule.days) * 0.2; // Slight penalty for date differences
            reason = `Date range match: ${diffDays.toFixed(1)} days <= ${rule.days} days`;
            rangeMatches++;
          } else {
            score = Math.max(0, 1 - (diffDays - rule.days) / rule.days);
            reason = `Date range exceeded: ${diffDays.toFixed(1)} days > ${rule.days} days`;
          }
        } else {
          score = 0;
          reason = `Range matching not supported for field type`;
        }
        break;
    }

    breakdown.push({ rule, score, reason });
    totalScore += score;
  }

  // Calculate weighted average (exact matches weighted higher)
  const weightedScore = rules.length > 0 ? totalScore / rules.length : 0;

  // Boost confidence if multiple exact matches
  const exactMatchBonus = exactMatches > 1 ? 0.1 : 0;
  const finalScore = Math.min(1.0, weightedScore + exactMatchBonus);

  return {
    score: finalScore,
    breakdown,
    factors: {
      exactMatches,
      fuzzyMatches,
      rangeMatches,
      totalRules: rules.length,
    },
  };
}

/**
 * Calculate string similarity (Levenshtein distance normalized)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  // Reserved for future optimization
  const _shorter = str1.length > str2.length ? str2 : str1;
  void _shorter;

  if (longer.length === 0) {
    return 1.0;
  }

  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  return (longer.length - distance) / longer.length;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    if (!matrix[0]) {
      matrix[0] = [];
    }
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (!matrix[i]) {
        matrix[i] = [];
      }
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
  if (!lastRow) {
    return str1.length;
  }
  return lastRow[str1.length] ?? str1.length;
}

/**
 * Explain confidence score in human-readable format
 */
export function explainConfidenceScore(confidence: ConfidenceScore): string {
  const { score, breakdown: _breakdown, factors } = confidence;
  void _breakdown;

  if (score >= 0.95) {
    return `High confidence (${(score * 100).toFixed(1)}%): ${factors.exactMatches} exact matches, all rules satisfied.`;
  } else if (score >= 0.80) {
    return `Medium confidence (${(score * 100).toFixed(1)}%): ${factors.exactMatches} exact matches, ${factors.fuzzyMatches} fuzzy matches.`;
  } else if (score >= 0.50) {
    return `Low confidence (${(score * 100).toFixed(1)}%): Some matches found but not all rules satisfied. Review recommended.`;
  } else {
    return `Very low confidence (${(score * 100).toFixed(1)}%): Few matches found. Manual review required.`;
  }
}
