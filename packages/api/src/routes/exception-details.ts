import { Router, Response } from "express";
import { prisma } from "../infrastructure/db/prisma";
import { AuthRequest } from "../middleware/auth";
import { requirePermission } from "../middleware/authorization";
import { Permission } from "../infrastructure/security/Permissions";
import { handleRouteError } from "../utils/error-handler";
import { NotFoundError } from "../utils/typed-errors";

const router = Router();

const CANONICAL_EXCEPTION_MATCH_TYPES = ["unmatched", "conflict"] as const;

async function validateExceptionAccess(id: string, tenantId: string) {
  const exception = await prisma.reconciliationMatch.findFirst({
    where: { id, tenantId, matchType: { in: [...CANONICAL_EXCEPTION_MATCH_TYPES] } },
    select: { id: true },
  });

  if (!exception) {
    throw new NotFoundError("Exception not found", "exception", id);
  }

  return exception;
}

router.get(
  "/exceptions/:id/memories",
  requirePermission(Permission.REPORTS_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const id = typeof req.params["id"] === "string" ? req.params["id"] : "";
      const tenantId = req.tenantId!;
      await validateExceptionAccess(id, tenantId);

      const memories = await prisma.exceptionAdjudicationMemory.findMany({
        where: { tenantId, exceptionId: id },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          resolution: true,
          resolutionReason: true,
          adjudicationType: true,
          adjudicatorId: true,
          adjudicatorType: true,
          outcome: true,
          confidence: true,
          sourceTrustScore: true,
          operatorNotes: true,
          systemNotes: true,
          evidenceIds: true,
          createdAt: true,
          completedAt: true,
          parentMemoryId: true,
        },
      });
      res.json({ data: memories });
    } catch (error) {
      handleRouteError(res, error, "Failed to get exception memories");
    }
  }
);

router.get(
  "/exceptions/:id/evidence",
  requirePermission(Permission.REPORTS_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const id = typeof req.params["id"] === "string" ? req.params["id"] : "";
      const tenantId = req.tenantId!;
      await validateExceptionAccess(id, tenantId);

      const evidenceArtifacts = await prisma.evidenceArtifact.findMany({
        where: { tenantId, exceptionId: id },
        orderBy: { capturedAt: "desc" },
        select: {
          id: true,
          artifactType: true,
          artifactKey: true,
          capturedAt: true,
          capturedBy: true,
          degraded: true,
          degradedReasons: true,
          attested: true,
          reliabilityScore: true,
        },
      });
      res.json({ data: evidenceArtifacts });
    } catch (error) {
      handleRouteError(res, error, "Failed to get exception evidence");
    }
  }
);

router.get(
  "/exceptions/:id/proofs",
  requirePermission(Permission.REPORTS_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const id = typeof req.params["id"] === "string" ? req.params["id"] : "";
      const tenantId = req.tenantId!;
      await validateExceptionAccess(id, tenantId);

      const proofPackages = await prisma.proofPackage.findMany({
        where: {
          tenantId,
          packageKey: {
            startsWith: `exception:${id}:`,
          },
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          packageType: true,
          packageKey: true,
          status: true,
          completenessScore: true,
          missingEvidence: true,
          completenessFlags: true,
          evidenceIds: true,
          createdAt: true,
          finalizedAt: true,
        },
      });
      res.json({ data: proofPackages });
    } catch (error) {
      handleRouteError(res, error, "Failed to get exception proofs");
    }
  }
);

router.get(
  "/exceptions/:id/provenance",
  requirePermission(Permission.REPORTS_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const id = typeof req.params["id"] === "string" ? req.params["id"] : "";
      const tenantId = req.tenantId!;
      await validateExceptionAccess(id, tenantId);

      const provenance = await prisma.reconciliationProvenance.findMany({
        where: { tenantId, matchId: id },
        orderBy: { sequence: "asc" },
        select: {
          id: true,
          sequence: true,
          eventType: true,
          actorType: true,
          actorUserId: true,
          details: true,
          createdAt: true,
        },
      });
      res.json({ data: provenance });
    } catch (error) {
      handleRouteError(res, error, "Failed to get exception provenance");
    }
  }
);

export { router as exceptionDetailsRouter };
