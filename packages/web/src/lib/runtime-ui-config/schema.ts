/**
 * Runtime UI Config (Public)
 *
 * Data-driven UI config that can be edited at runtime (DB / config store)
 * and safely consumed by the frontend without rebuilds.
 *
 * Rules:
 * - No secrets
 * - Strict allowlist schema
 * - Safe defaults on missing/invalid config
 */

import { z } from "zod";

export const PublicRuntimeUiConfigSchema = z
  .object({
    version: z.number().int().min(1).default(1),

    tokens: z
      .object({
        density: z.enum(["comfortable", "compact"]).default("comfortable"),
        radiusScale: z.number().min(0.5).max(2).default(1),
        cardElevation: z.enum(["none", "sm", "default", "lg"]).default("default"),
      })
      .default({ density: "comfortable", radiusScale: 1, cardElevation: "default" }),

    copy: z
      .object({
        announcement: z
          .object({
            enabled: z.boolean().default(false),
            message: z.string().max(200).default(""),
            tone: z.enum(["info", "warning", "success"]).default("info"),
            linkHref: z.string().url().optional(),
            linkLabel: z.string().max(40).optional(),
          })
          .default({ enabled: false, message: "", tone: "info" }),
      })
      .default({ announcement: { enabled: false, message: "", tone: "info" } }),

    features: z
      .object({
        chatbot: z.boolean().default(true),
        floatingHelp: z.boolean().default(true),
      })
      .default({ chatbot: true, floatingHelp: true }),
  })
  .strict();

export type PublicRuntimeUiConfig = z.infer<typeof PublicRuntimeUiConfigSchema>;

export function safeParsePublicRuntimeUiConfig(input: unknown): PublicRuntimeUiConfig {
  const parsed = PublicRuntimeUiConfigSchema.safeParse(input);
  if (parsed.success) return parsed.data;

  // Safe defaults if config is missing or invalid
  return PublicRuntimeUiConfigSchema.parse({});
}
