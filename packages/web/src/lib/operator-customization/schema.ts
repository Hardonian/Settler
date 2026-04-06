/**
 * Versioned operator customization config (presentation + workflow layout only).
 * Does not describe reconciliation outcomes, evidence contracts, or run health semantics.
 */

import { z } from "zod";

export const CUSTOMIZATION_SCHEMA_VERSION = "1" as const;

export const OperatorSurfaceIdSchema = z.enum(["admin_dashboard"]);
export type OperatorSurfaceId = z.infer<typeof OperatorSurfaceIdSchema>;

export const OperatingModeSchema = z.enum(["standard", "solo_operator", "buyer_demo"]);
export type OperatingMode = z.infer<typeof OperatingModeSchema>;

export const ModulePlacementSchema = z.object({
  moduleId: z.string().min(1),
  enabled: z.boolean(),
  order: z.number().int().min(0).max(999),
  titleOverride: z.string().max(120).optional(),
  helpOverride: z.string().max(500).optional(),
  /** Numeric attention rules for modules that support them (e.g. usage warning). */
  thresholdOverrides: z.record(z.string(), z.number().finite()).optional(),
});

export type ModulePlacement = z.infer<typeof ModulePlacementSchema>;

export const OperatorSurfaceCustomizationSchema = z.object({
  schemaVersion: z.literal(CUSTOMIZATION_SCHEMA_VERSION),
  operatingMode: OperatingModeSchema.default("standard"),
  modules: z.array(ModulePlacementSchema).max(64),
  /** Last applied preset id for operator visibility (not authoritative for validation). */
  lastAppliedPresetId: z.string().max(64).optional(),
});

export type OperatorSurfaceCustomization = z.infer<typeof OperatorSurfaceCustomizationSchema>;

export const CustomizationPatchSchema = z.object({
  operatingMode: OperatingModeSchema.optional(),
  modules: z.array(ModulePlacementSchema).optional(),
  lastAppliedPresetId: z.string().max(64).optional(),
});

export type CustomizationPatch = z.infer<typeof CustomizationPatchSchema>;

export const ProposalStatusSchema = z.enum(["pending", "applied", "rejected"]);
export type ProposalStatus = z.infer<typeof ProposalStatusSchema>;

/** `premium_llm` reserved for future advisory lane; never implies autonomous publish. */
export const InferenceModeSchema = z.enum(["rules", "degraded_unavailable", "premium_llm"]);
export type InferenceMode = z.infer<typeof InferenceModeSchema>;
