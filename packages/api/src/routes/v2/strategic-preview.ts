import type { Response } from "express";
import type { AuthRequest } from "../../middleware/auth";
import { observeCapabilityStatus } from "../../services/capabilities/telemetry";
import type { CapabilityStatus } from "../../services/capabilities/types";

export const STRATEGIC_PREVIEW_ENV_VAR = "SETTLER_ENABLE_V2_STRATEGIC_PREVIEW";

const DEFAULT_SETUP_STEPS = [
  "Back the surface with tenant-scoped durable storage or orchestration state.",
  "Eliminate cross-tenant singleton mutation or retrieval paths.",
  "Keep degraded/local-only capability state machine-visible in every response.",
  "Lock the surface with tenant/authz tests and security verification before enabling preview.",
];

export interface StrategicSurfaceDefinition {
  key: string;
  unavailableReason: string;
  previewReason: string;
  setupSteps?: string[];
}

export function strategicPreviewEnabled(): boolean {
  return process.env[STRATEGIC_PREVIEW_ENV_VAR] === "true";
}

function buildStrategicSurfaceCapability(
  definition: StrategicSurfaceDefinition
): CapabilityStatus {
  if (strategicPreviewEnabled()) {
    return {
      key: definition.key,
      state: "degraded",
      available: true,
      source: "oss",
      reason: definition.previewReason,
      guarantee: "local_only",
    };
  }

  return {
    key: definition.key,
    state: "unavailable",
    available: false,
    source: "oss",
    reason: definition.unavailableReason,
    guarantee: "unavailable",
  };
}

export function requireStrategicSurfaceAvailability(
  req: AuthRequest,
  res: Response,
  route: string,
  definition: StrategicSurfaceDefinition
): CapabilityStatus | null {
  const capability = buildStrategicSurfaceCapability(definition);
  observeCapabilityStatus(capability, route);

  if (capability.available) {
    return capability;
  }

  res.status(503).json({
    error: "STRATEGIC_SURFACE_UNAVAILABLE",
    message: definition.unavailableReason,
    capability,
    setupRequired: true,
    retryable: false,
    previewEnabled: false,
    envFlag: STRATEGIC_PREVIEW_ENV_VAR,
    setupSteps: definition.setupSteps ?? DEFAULT_SETUP_STEPS,
    traceId: req.traceId,
  });
  return null;
}

export function buildStrategicSurfaceMetadata(
  req: AuthRequest,
  capability: CapabilityStatus
): {
  tenantId: string | null;
  preview: boolean;
  guarantee: CapabilityStatus["guarantee"] | null;
} {
  return {
    tenantId: req.tenantId ?? null,
    preview: capability.state === "degraded",
    guarantee: capability.guarantee ?? null,
  };
}
