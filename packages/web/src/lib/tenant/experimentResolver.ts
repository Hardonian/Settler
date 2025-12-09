/**
 * Experiment Resolver
 * 
 * Determines which experiment variant to show for a page.
 * Handles traffic splitting and session persistence.
 */

import { prisma } from '@/shared/db/prismaClient';
import { cookies } from 'next/headers';

/**
 * Get active experiment for a page
 */
export async function getActiveExperiment(tenantId: string, pageId: string) {
  return prisma.experiment.findFirst({
    where: {
      tenantId,
      targetPageId: pageId,
      status: 'running',
      OR: [
        { startsAt: null },
        { startsAt: { lte: new Date() } },
      ],
      AND: [
        {
          OR: [
            { endsAt: null },
            { endsAt: { gte: new Date() } },
          ],
        },
      ],
    },
    include: {
      variants: true,
    },
  });
}

/**
 * Select variant for a user/session based on traffic split
 */
export function selectVariant(
  experiment: {
    trafficSplit: Record<string, number>;
    variants: Array<{ key: string }>;
  },
  sessionId: string
): string {
  // Use session ID to ensure consistent assignment
  const hash = simpleHash(sessionId + experiment.variants[0].key);
  const random = hash % 100;
  
  let cumulative = 0;
  for (const variant of experiment.variants) {
    const split = experiment.trafficSplit[variant.key] || 0;
    cumulative += split;
    if (random < cumulative) {
      return variant.key;
    }
  }
  
  // Fallback to first variant
  return experiment.variants[0]?.key || 'A';
}

/**
 * Simple hash function for consistent variant assignment
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Get or create session ID
 */
export async function getSessionId(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get('experiment_session');
  
  if (existing?.value) {
    return existing.value;
  }
  
  const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  cookieStore.set('experiment_session', sessionId, {
    maxAge: 60 * 60 * 24 * 30, // 30 days
    httpOnly: false,
    sameSite: 'lax',
  });
  
  return sessionId;
}

/**
 * Resolve experiment variant for a page
 */
export async function resolveExperimentVariant(
  tenantId: string,
  pageId: string
): Promise<{
  experimentId: string | null;
  variantKey: string | null;
  blocksOverride: unknown[] | null;
}> {
  const experiment = await getActiveExperiment(tenantId, pageId);
  
  if (!experiment) {
    return {
      experimentId: null,
      variantKey: null,
      blocksOverride: null,
    };
  }
  
  const sessionId = await getSessionId();
  const variantKey = selectVariant(experiment, sessionId);
  const variant = experiment.variants.find(v => v.key === variantKey);
  
  return {
    experimentId: experiment.id,
    variantKey,
    blocksOverride: variant?.blocksOverride as unknown[] || null,
  };
}
