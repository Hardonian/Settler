/**
 * Input Manifest Schema
 * 
 * Defines the structure for reconciliation run input manifests.
 */

import { z } from 'zod';

export const InputManifestSchema = z.object({
  // Source information
  source: z.object({
    type: z.enum(['csv', 'stripe', 'shopify', 'manual', 'api']),
    id: z.string().optional(),
    name: z.string().optional(),
    recordCount: z.number().int().nonnegative().optional(),
    files: z.array(z.object({
      name: z.string(),
      size: z.number().int().nonnegative(),
      type: z.string().optional(),
    })).optional(),
  }),

  // Target information
  target: z.object({
    type: z.enum(['csv', 'stripe', 'shopify', 'manual', 'api']),
    id: z.string().optional(),
    name: z.string().optional(),
    recordCount: z.number().int().nonnegative().optional(),
    files: z.array(z.object({
      name: z.string(),
      size: z.number().int().nonnegative(),
      type: z.string().optional(),
    })).optional(),
  }),

  // Configuration
  config: z.object({
    matchRules: z.array(z.string()).optional(),
    dateRange: z.object({
      start: z.string().datetime().optional(),
      end: z.string().datetime().optional(),
    }).optional(),
    currency: z.string().length(3).optional(),
  }).optional(),

  // Metadata
  metadata: z.record(z.unknown()).optional(),
});

export type InputManifest = z.infer<typeof InputManifestSchema>;

/**
 * Validate input manifest
 */
export function validateInputManifest(data: unknown): {
  valid: boolean;
  manifest?: InputManifest;
  errors?: z.ZodError;
} {
  try {
    const manifest = InputManifestSchema.parse(data);
    return { valid: true, manifest };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, errors: error };
    }
    return { valid: false };
  }
}
