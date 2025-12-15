/**
 * A/B Testing Infrastructure
 * Provides A/B testing capabilities for conversion optimization
 */

export interface ABTestVariant {
  id: string;
  name: string;
  weight: number; // 0-100, percentage of traffic
}

export interface ABTest {
  id: string;
  name: string;
  variants: ABTestVariant[];
  active: boolean;
  startDate: Date;
  endDate?: Date;
}

/**
 * Simple A/B test assignment based on consistent hashing
 */
export function assignVariant(testId: string, userId: string): string {
  // Use consistent hashing to ensure same user gets same variant
  const hash = simpleHash(`${testId}:${userId}`);
  return hash.toString();
}

/**
 * Simple hash function for consistent assignment
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Get variant for user based on test configuration
 */
export function getVariant(
  test: ABTest,
  userId: string
): ABTestVariant | null {
  if (!test.active) {
    return null;
  }

  if (test.endDate && new Date() > test.endDate) {
    return null;
  }

  const assignment = assignVariant(test.id, userId);
  const totalWeight = test.variants.reduce((sum, v) => sum + v.weight, 0);
  const normalizedAssignment = (assignment % totalWeight) + 1;

  let cumulativeWeight = 0;
  for (const variant of test.variants) {
    cumulativeWeight += variant.weight;
    if (normalizedAssignment <= cumulativeWeight) {
      return variant;
    }
  }

  // Fallback to first variant
  return test.variants[0];
}

/**
 * Track A/B test conversion
 */
export async function trackABTestConversion(
  testId: string,
  variantId: string,
  userId: string,
  conversionEvent: string
): Promise<void> {
  try {
    await fetch('/api/analytics/ab-test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        testId,
        variantId,
        userId,
        conversionEvent,
        timestamp: new Date().toISOString(),
      }),
    }).catch((error) => {
      console.error('Failed to track A/B test conversion:', error);
    });
  } catch (error) {
    console.error('A/B test tracking error:', error);
  }
}

/**
 * Predefined A/B tests
 */
export const AB_TESTS: Record<string, ABTest> = {
  pricing_page_cta: {
    id: 'pricing_page_cta',
    name: 'Pricing Page CTA',
    variants: [
      { id: 'control', name: 'Start Free Trial', weight: 50 },
      { id: 'variant_a', name: 'Get Started Free', weight: 50 },
    ],
    active: true,
    startDate: new Date('2026-01-01'),
  },
  homepage_hero: {
    id: 'homepage_hero',
    name: 'Homepage Hero Copy',
    variants: [
      { id: 'control', name: 'Current', weight: 50 },
      { id: 'variant_a', name: 'Alternative', weight: 50 },
    ],
    active: false,
    startDate: new Date('2026-01-01'),
  },
};
