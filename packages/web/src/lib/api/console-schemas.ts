/**
 * Console API Validation Schemas
 * 
 * Zod schemas for input validation across all console API routes.
 * Ensures type safety and prevents invalid data from reaching handlers.
 */

import { z } from 'zod';

// Common schemas
export const paginationSchema = z.object({
  limit: z.number().int().min(1).max(100).optional().default(50),
  offset: z.number().int().min(0).optional().default(0),
});

export const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// API Keys
export const createApiKeySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  scopes: z.array(z.string()).optional().default(['*']),
  expiresAt: z.string().datetime().optional(),
});

export const listApiKeysSchema = paginationSchema;

// Receipts
export const listReceiptsSchema = paginationSchema.extend({
  billingAccountId: z.string().uuid().optional(),
});

export const getReceiptSchema = z.object({
  id: z.string().uuid(),
});

// Feature Flags
export const listFeatureFlagsSchema = paginationSchema.extend({
  billingAccountId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
});

export const updateFlagEnvironmentSchema = z.object({
  flagId: z.string().uuid(),
  environment: z.enum(['development', 'staging', 'production']),
  enabled: z.boolean().optional(),
  variant: z.unknown().optional(),
});

// Usage
export const getUsageSchema = dateRangeSchema.extend({
  days: z.number().int().min(1).max(365).optional().default(7),
});

// Billing
export const getBillingSchema = z.object({});

// Site Builder
export const createPageSchema = z.object({
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/),
  pageType: z.enum(['marketing', 'landing', 'docs']).optional().default('marketing'),
  blocks: z.array(z.unknown()).optional().default([]),
  seoTitle: z.string().max(200).optional(),
  seoDescription: z.string().max(500).optional(),
  seoImageUrl: z.string().url().optional(),
  isDraft: z.boolean().optional().default(true),
});

export const updatePageSchema = createPageSchema.partial().extend({
  id: z.string().uuid(),
});

export const updateBrandingSchema = z.object({
  logoUrl: z.string().url().optional(),
  faviconUrl: z.string().url().optional(),
  primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
  secondaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
  accentColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
  backgroundColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
  borderRadiusScale: z.number().min(0).max(2).optional(),
  fontFamilyPrimary: z.string().max(100).optional(),
  fontFamilySecondary: z.string().max(100).optional(),
});

export const updateNavigationSchema = z.object({
  navItems: z.array(
    z.object({
      label: z.string().min(1),
      href: z.string().min(1),
      type: z.enum(['internal', 'external']),
    })
  ).optional(),
  footerItems: z.array(
    z.object({
      label: z.string().min(1),
      href: z.string().min(1),
      type: z.enum(['internal', 'external']),
    })
  ).optional(),
});

// Type exports
export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;
export type ListApiKeysInput = z.infer<typeof listApiKeysSchema>;
export type ListReceiptsInput = z.infer<typeof listReceiptsSchema>;
export type GetReceiptInput = z.infer<typeof getReceiptSchema>;
export type ListFeatureFlagsInput = z.infer<typeof listFeatureFlagsSchema>;
export type UpdateFlagEnvironmentInput = z.infer<typeof updateFlagEnvironmentSchema>;
export type GetUsageInput = z.infer<typeof getUsageSchema>;
export type CreatePageInput = z.infer<typeof createPageSchema>;
export type UpdatePageInput = z.infer<typeof updatePageSchema>;
export type UpdateBrandingInput = z.infer<typeof updateBrandingSchema>;
export type UpdateNavigationInput = z.infer<typeof updateNavigationSchema>;
