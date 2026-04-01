import { Router, Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { requirePermission } from "../middleware/authorization";
import { Permission } from "../infrastructure/security/Permissions";
import { prisma } from "../infrastructure/db/prisma";
import { NotFoundError, ValidationError as BadRequestError } from "../utils/typed-errors";
import { handleRouteError } from "../utils/error-handler";
import { logInfo } from "../utils/logger";
import { AdjudicationMemoryService } from "../services/intelligence/adjudication-memory";
import { STANDARD_EVIDENCE_REQUIREMENTS } from "@settler/proofs";
import { RunDeltaService } from "../services/intelligence/run-delta";
import { Prisma } from "@prisma/client";
import * as crypto from "crypto";

const router = Router();
const adjudicationMemoryService = new AdjudicationMemoryService(prisma);
const runDeltaService = new RunDeltaService(prisma);

/**
 * Utility to compute payload hash for evidence integrity
 * Uses sorted keys for deterministic serialization consistent with @settler/proofs
 */
function computePayloadHash(payload: Record<string, unknown>): string {
  const sortedKeys =
    typeof payload === "object" && payload !== null ? Object.keys(payload).sort() : undefined;
  const content = sortedKeys ? JSON.stringify(payload, sortedKeys) : JSON.stringify(payload);
  return crypto.createHash("sha256").update(content).digest("hex");
}

/**
 * GET /api/intelligence/exceptions/:exceptionId/similar
 * Find similar past exceptions for decision support mapping
 */
router.get(
  "/exceptions/:exceptionId/similar",
  requirePermission(Permission.OPERATOR_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const exceptionId = req.params.exceptionId as string;
      const limit = parseInt(req.query.limit as string) || 5;
      const includeResolved = req.query.includeResolved === "true";

      const exception = await prisma.reconciliationMatch.findFirst({
        where: { id: exceptionId, tenantId },
      });

      if (!exception) {
        throw new NotFoundError("Exception not found", "exception", exceptionId);
      }

      // Fetch similar cases using AdjudicationMemoryService
      const currentClassifications = await prisma.exceptionArchetypeClassification.findMany({
        where: { exceptionId },
        include: { archetype: true },
      });

      const primaryArchetypeId = currentClassifications[0]?.archetypeId;

      const similarCases = await adjudicationMemoryService.findSimilarCases({
        tenantId,
        excludeExceptionId: exceptionId,
        limit,
        archetypeId: primaryArchetypeId,
      });

      logInfo("Similar cases intelligence retrieved", {
        tenantId,
        exceptionId,
        similarCount: similarCases.length,
        archetypeMatch: !!primaryArchetypeId,
        includeResolved,
      });

      return res.json({
        data: similarCases.map((match) => ({
          id: match.exceptionId,
          status: match.resolution,
          similarity: match.similarityScore,
          resolution: match.resolution,
          resolutionReason: match.resolutionReason,
          confidence: match.confidence,
          archetype: match.archetypeCode,
          links: [
            { rel: "details", href: `/api/exceptions/${match.exceptionId}` },
            { rel: "status", href: `/api/exceptions/${match.exceptionId}/status` },
          ],
        })),
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to retrieve similar cases", 500, {
        userId: req.userId,
        exceptionId: req.params.exceptionId,
      });
      return;
    }
  }
);

/**
 * GET /api/intelligence/exceptions/:exceptionId/completeness
 * Evaluate evidence completeness for an exception
 */
router.get(
  "/exceptions/:exceptionId/completeness",
  requirePermission(Permission.OPERATOR_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const exceptionId = req.params.exceptionId as string;

      const evidence = await prisma.evidenceArtifact.findMany({
        where: { exceptionId, tenantId },
      });

      // Simple evidence assessment
      const requiredTypes = ["source_snapshot", "target_snapshot", "match_comparison"];
      const presentTypes = evidence.map((e) => e.artifactType);

      const missing = requiredTypes.filter((t) => !presentTypes.includes(t));
      const score = 1 - missing.length / requiredTypes.length;

      return res.json({
        data: {
          exceptionId,
          completenessScore: score,
          missingEvidence: missing,
          evidenceCount: evidence.length,
          isActionable: score >= 0.6,
        },
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to evaluate evidence completeness", 500, {
        userId: req.userId,
        exceptionId: req.params.exceptionId,
      });
      return;
    }
  }
);

/**
 * GET /api/archetypes
 * List all exception archetypes for the tenant
 */
router.get(
  "/archetypes",
  requirePermission(Permission.OPERATOR_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const category = req.query.category as string;
      const isActive = req.query.isActive === "false" ? false : true;

      const archetypes = await prisma.exceptionArchetype.findMany({
        where: {
          tenantId,
          ...(category && { category }),
          ...(isActive && { isActive: true }),
        },
        orderBy: { label: "asc" },
      });

      logInfo("Exception archetypes retrieved", {
        tenantId,
        count: archetypes.length,
      });

      return res.json({ data: archetypes });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to retrieve archetypes", 500, {
        userId: req.userId,
      });
      return;
    }
  }
);

/**
 * POST /api/archetypes
 * Create a new exception archetype
 */
router.post(
  "/archetypes",
  requirePermission(Permission.ADMIN_WRITE),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const { code, label, category, description, severityDefault, matchPattern } = req.body as {
        code: string;
        label: string;
        category: string;
        description?: string;
        severityDefault?: string;
        matchPattern?: any;
      };

      if (!code || !label || !category) {
        throw new BadRequestError("Missing required fields: code, label, category");
      }

      const archetype = await prisma.exceptionArchetype.create({
        data: {
          tenantId,
          code,
          label,
          category,
          description: description || "",
          severityDefault: severityDefault || "medium",
          isActive: true,
          matchPattern: (matchPattern as Prisma.InputJsonValue) || {},
        },
      });

      logInfo("Exception archetype created", {
        tenantId,
        archetypeId: archetype.id,
        code,
      });

      return res.status(201).json({ data: archetype });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to create archetype", 500, {
        userId: req.userId,
      });
      return;
    }
  }
);

/**
 * GET /api/evidence
 * List evidence artifacts with filtering
 */
router.get(
  "/evidence",
  requirePermission(Permission.OPERATOR_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const exceptionId = req.query.exceptionId as string;
      const runId = req.query.runId as string;
      const artifactType = req.query.artifactType as string;

      const artifacts = await prisma.evidenceArtifact.findMany({
        where: {
          tenantId,
          ...(exceptionId && { exceptionId }),
          ...(runId && { runId }),
          ...(artifactType && { artifactType }),
        },
        orderBy: { capturedAt: "desc" },
      });

      return res.json({ data: artifacts });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to list evidence", 500, {
        userId: req.userId,
      });
      return;
    }
  }
);

/**
 * POST /api/evidence
 * Record a new evidence artifact
 */
router.post(
  "/evidence",
  requirePermission(Permission.OPERATOR_WRITE),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const {
        artifactType,
        artifactKey,
        payload,
        sourceType,
        sourceId,
        exceptionId,
        runId,
        reliabilityScore,
        metadata,
      } = req.body as {
        artifactType: string;
        artifactKey: string;
        payload: Record<string, unknown>;
        sourceType?: string;
        sourceId?: string;
        exceptionId?: string;
        runId?: string;
        reliabilityScore?: number;
        metadata?: Record<string, unknown>;
      };

      if (!artifactType || !artifactKey || !payload) {
        throw new BadRequestError("Missing required fields: artifactType, artifactKey, payload");
      }

      const payloadHash = computePayloadHash(payload);
      const reliabilityFactors = reliabilityScore
        ? [{ factor: "operator_assigned", weight: 0.5, value: reliabilityScore }]
        : [];

      const artifact = await prisma.evidenceArtifact.create({
        data: {
          tenantId,
          artifactType,
          artifactKey,
          payload: payload as Prisma.InputJsonValue,
          payloadHash,
          sourceType,
          sourceId,
          exceptionId,
          runId,
          reliabilityScore: reliabilityScore ? new Prisma.Decimal(reliabilityScore) : null,
          reliabilityFactors: reliabilityFactors as Prisma.InputJsonValue,
          metadata: (metadata as Prisma.InputJsonValue) || {},
        },
      });

      logInfo("Evidence artifact recorded", {
        tenantId,
        artifactId: artifact.id,
        artifactType,
        artifactKey,
      });

      return res.status(201).json({ data: artifact });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to record evidence", 500, {
        userId: req.userId,
      });
      return;
    }
  }
);

/**
 * GET /api/evidence/:artifactId
 * Get evidence artifact by ID
 */
router.get(
  "/evidence/:artifactId",
  requirePermission(Permission.OPERATOR_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const artifactId = req.params.artifactId as string;

      const artifact = await prisma.evidenceArtifact.findFirst({
        where: { id: artifactId, tenantId },
      });

      if (!artifact) {
        throw new NotFoundError("Evidence artifact not found", "evidence_artifact", artifactId);
      }

      return res.json({ data: artifact });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to get evidence", 500, {
        userId: req.userId,
        artifactId: req.params.artifactId,
      });
      return;
    }
  }
);

/**
 * POST /api/proofpackages
 * Generate proof package for audit/exports
 */
router.post(
  "/proofpackages",
  requirePermission(Permission.ADMIN_WRITE),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const {
        packageType,
        packageKey,
        scope,
        scopeIds,
        includeEvidence = true,
      } = req.body as {
        packageType: string;
        packageKey: string;
        scope: "run" | "job" | "tenant" | "custom";
        scopeIds: string[];
        includeEvidence?: boolean;
      };

      if (!packageType || !packageKey) {
        throw new BadRequestError("Missing required fields: packageType, packageKey");
      }

      const evidenceArtifacts = includeEvidence
        ? await prisma.evidenceArtifact.findMany({
            where: {
              tenantId,
              ...(scope === "run" && { runId: { in: scopeIds } }),
              ...(scope === "job" && { metadata: { path: ["jobId"], equals: scopeIds[0] } }), // Example
            },
          })
        : [];

      // Calculate completeness based on artifacts found
      const requirements = STANDARD_EVIDENCE_REQUIREMENTS[packageType] || [];
      const presentTypes = evidenceArtifacts.map((e) => e.artifactType);
      const missing = (requirements as any[]).filter((r) => !presentTypes.includes(r.type));
      const score =
        requirements.length > 0
          ? (requirements.length - missing.length) / requirements.length
          : 1.0;

      const summary = {
        packageType,
        scope,
        scopeIds,
        artifactCount: evidenceArtifacts.length,
        generatedAt: new Date().toISOString(),
      };

      const packageHash = crypto
        .createHash("sha256")
        .update(JSON.stringify({ summary, evidenceIds: evidenceArtifacts.map((e) => e.id) }))
        .digest("hex");

      const proofpack = await prisma.proofPackage.create({
        data: {
          tenantId,
          packageType,
          packageKey,
          scope,
          scopeIds: scopeIds as unknown as Prisma.InputJsonValue,
          evidenceIds: evidenceArtifacts.map((e) => e.id) as unknown as Prisma.InputJsonValue,
          summary: summary as unknown as Prisma.InputJsonValue,
          completenessScore: new Prisma.Decimal(score),
          missingEvidence: missing as unknown as Prisma.InputJsonValue,
          packageHash,
          status: "draft",
        },
      });

      logInfo("Proof package generated", {
        tenantId,
        packageId: proofpack.id,
        packageType,
        artifactCount: evidenceArtifacts.length,
      });

      return res.status(201).json({ data: proofpack });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to generate proof package", 500, {
        userId: req.userId,
      });
      return;
    }
  }
);

/**
 * GET /api/proofpackages/:packageId/verify
 * Verify integrity of a proof package
 */
router.get(
  "/proofpackages/:packageId/verify",
  requirePermission(Permission.ADMIN_WRITE),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const packageId = req.params.packageId as string;

      const proofpack = await prisma.proofPackage.findFirst({
        where: { id: packageId, tenantId },
      });

      if (!proofpack) {
        throw new NotFoundError("Proof package not found", "proof_package", packageId);
      }

      const computedHash = crypto
        .createHash("sha256")
        .update(
          JSON.stringify({
            summary: proofpack.summary,
            evidenceIds: proofpack.evidenceIds,
          })
        )
        .digest("hex");

      const isValid = computedHash === proofpack.packageHash;

      return res.json({
        data: {
          packageId: proofpack.id,
          isValid,
          computedHash,
          storedHash: proofpack.packageHash,
          status: proofpack.status,
          verifiedAt: new Date().toISOString(),
        },
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to verify proof package", 500, {
        userId: req.userId,
        packageId: req.params.packageId,
      });
      return;
    }
  }
);

/**
 * GET /api/jobs/:jobId/delta/full
 * Get full delta history with trend analysis using RunDeltaService
 */
router.get(
  "/jobs/:jobId/delta/full",
  requirePermission(Permission.JOBS_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const jobId = req.params.jobId as string;
      const limit = parseInt(req.query.limit as string) || 10;

      const history = await runDeltaService.getDeltaHistory(tenantId, jobId, limit);

      if (history.length === 0) {
        return res.json({
          data: {
            jobId,
            deltas: [],
            message: "No run deltas found for this job",
          },
        });
      }

      const significantChanges = await runDeltaService.getSignificantChanges(tenantId, jobId);

      logInfo("Full delta history retrieved", {
        tenantId,
        jobId,
        deltaCount: history.length,
      });

      return res.json({
        data: {
          jobId,
          deltas: history,
          analysis: {
            significantChanges,
          },
        },
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to retrieve delta history", 500, {
        userId: req.userId,
        jobId: req.params.jobId,
      });
      return;
    }
  }
);

export { router as exceptionIntelligenceRouter };
