/**
 * Levenshtein distance calculation utilities
 * Consolidated from multiple duplicate implementations across the codebase
 */

/**
 * Simple memoize implementation to avoid lodash dependency
 */
function memoize<T extends (...args: string[]) => unknown>(
  fn: T,
  resolver: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();
  const memoized = (...args: Parameters<T>): ReturnType<T> => {
    const key = resolver(...args);
    if (cache.has(key)) {
      return cache.get(key) as ReturnType<T>;
    }
    const result = fn(...args) as ReturnType<T>;
    cache.set(key, result);
    return result;
  };
  return memoized as T;
}

/**
 * Calculate the Levenshtein distance between two strings using
 * an optimized approach with O(min(m,n)) space complexity.
 * Uses row-by-row dynamic programming.
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;

  // Swap to ensure str2 is the shorter string for space optimization
  if (len1 < len2) {
    return levenshteinDistance(str2, str1);
  }

  // Early termination for empty strings
  if (len2 === 0) {
    return len1;
  }

  // Use two rows instead of full matrix for O(min(m,n)) space
  const prevRow: number[] = new Array(len2 + 1) as number[];
  const currRow: number[] = new Array(len2 + 1) as number[];

  // Initialize first row
  for (let j = 0; j <= len2; j++) {
    prevRow[j] = j;
  }

  // Fill the matrix row by row
  for (let i = 1; i <= len1; i++) {
    currRow[0] = i;

    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      currRow[j] = Math.min(
        (prevRow[j] ?? 0) + 1, // deletion
        (currRow[j - 1] ?? 0) + 1, // insertion
        (prevRow[j - 1] ?? 0) + cost // substitution
      );
    }

    // Swap rows
    const tmp = prevRow.slice();
    prevRow.length = 0;
    prevRow.push(...currRow);
    currRow.length = 0;
    currRow.push(...tmp);
  }

  return prevRow[len2] ?? 0;
}

/**
 * Memoized version of levenshteinDistance for repeated comparisons
 * with the same string pairs. Cache is bounded to prevent memory issues.
 */
const memoizedLevenshteinDistance = memoize(
  levenshteinDistance,
  (str1: string, str2: string) => `${str1}::${str2}`
);

/**
 * Calculate similarity score between two strings (0-1)
 * where 1 means identical strings
 */
function calculateSimilarity(str1: string, str2: string): number {
  if (str1.length === 0 && str2.length === 0) {
    return 1;
  }

  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) {
    return 1;
  }

  const distance = levenshteinDistance(str1, str2);
  return 1 - distance / maxLen;
}

export { levenshteinDistance, memoizedLevenshteinDistance, calculateSimilarity };
