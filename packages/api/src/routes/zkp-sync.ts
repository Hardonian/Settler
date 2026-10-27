import { Router, Response } from "express";
import crypto from "node:crypto";
import { AuthRequest } from "../middleware/auth";
import { requirePermission } from "../middleware/authorization";
import { Permission } from "../infrastructure/security/Permissions";
import { handleRouteError } from "../utils/error-handler";
import { prisma } from "../infrastructure/db/prisma";
import { createRunProofPackageWithArtifacts } from "../services/intelligence/proof-package-orchestrator";

const router: Router = Router();

function hashLeaf(content: string): string {
  return crypto
    .createHash("sha256")
    .update(Buffer.concat([Buffer.from([0x00]), Buffer.from(content, "utf8")]))
    .digest("hex");
}

function hashNode(left: string, right: string): string {
  return crypto
    .createHash("sha256")
    .update(
      Buffer.concat([Buffer.from([0x01]), Buffer.from(left, "hex"), Buffer.from(right, "hex")])
    )
    .digest("hex");
}

/**
 * POST /api/intelligence/zkp/generate
 * Generates a signed Merkle commitment for later counterparty verification.
 */
router.post(
  "/zkp/generate",
  requirePermission(Permission.JOBS_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId;
      if (!tenantId) {
        return res.status(400).json({ error: "Missing required tenant context" });
      }

      const { targetTenantId, runId, salt = "" } = req.body;
      if (!targetTenantId || !runId) {
        return res
          .status(400)
          .json({ error: "Missing required parameters: targetTenantId and runId" });
      }
      if (typeof salt !== "string" || salt.length > 256) {
        return res.status(400).json({ error: "Invalid commitment salt" });
      }

      // Query the run scoped to this tenant
      const run = await prisma.reconciliationRun.findFirst({
        where: { id: runId, tenantId },
        select: {
          id: true,
          status: true,
          sourceCount: true,
          targetCount: true,
          matchedCount: true,
          unmatchedSourceCount: true,
          createdAt: true,
        },
      });
      if (!run) return res.status(404).json({ error: "Reconciliation run not found" });

      const total = run.sourceCount + run.targetCount;
      const matched = run.matchedCount;
      const unmatched = run.unmatchedSourceCount;

      // Construct domain-separated leaf commitments for parity validation.
      const leaves = [
        hashLeaf(`${tenantId}:${runId}:total:${total}:${salt}`),
        hashLeaf(`${tenantId}:${runId}:matched:${matched}:${salt}`),
        hashLeaf(`${tenantId}:${runId}:unmatched:${unmatched}:${salt}`),
        hashLeaf(`${tenantId}:${targetTenantId}:counterparty_anchor:${salt}`),
      ];

      // 2-level Merkle root
      const parentLeft = hashNode(leaves[0]!, leaves[1]!);
      const parentRight = hashNode(leaves[2]!, leaves[3]!);
      const merkleRoot = hashNode(parentLeft, parentRight);

      // Commitment hash incorporating the secret key
      const secret = process.env.PROOF_COMMITMENT_SECRET ?? process.env.COOKIE_SECRET;
      if (!secret || Buffer.byteLength(secret, "utf8") < 32) {
        return res.status(503).json({ error: "Proof commitment signing is not configured" });
      }
      const proofHash = crypto
        .createHmac("sha256", secret)
        .update(`${tenantId}:${targetTenantId}:${runId}:${merkleRoot}`)
        .digest("hex");

      // Bind relational ProofPackage and EvidenceArtifact records for bilateral Merkle root completion
      await createRunProofPackageWithArtifacts(prisma, {
        tenantId,
        runId,
        merkleRoot,
        inputFingerprint: leaves[0]!,
        outputFingerprint: leaves[1]!,
        ruleSetHash: leaves[2]!,
        packageType: "audit_export",
      });

      return res.json({
        data: {
          proofId: `zkp_${crypto.randomUUID()}`,
          tenantId,
          targetTenantId,
          runId,
          proofHash,
          merkleRoot,
          algorithm: "Merkle-HMAC-Commitment-v1",
          parityProof: {
            leafCount: leaves.length,
            depth: 2,
            recordCountCommitment: leaves[0],
            statusCommitment: hashLeaf(run.status),
          },
          generatedAt: new Date().toISOString(),
          status: "commitment_generated",
          message:
            "Merkle-HMAC commitment generated. This artifact is not a zero-knowledge proof and requires counterparty verification.",
        },
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to generate ZKP", 500, {
        userId: req.userId,
      });
      return;
    }
  }
);

/**
 * POST /api/intelligence/zkp/verify
 * Verifies a cryptographic parity proof against a claimed Merkle root.
 */
router.post(
  "/zkp/verify",
  requirePermission(Permission.JOBS_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const { proofHash, merkleRoot, tenantId: bodyTenantId, targetTenantId, runId } = req.body;
      const effectiveTenantId = bodyTenantId || req.tenantId;

      if (!proofHash || typeof proofHash !== "string" || !/^[a-f0-9]{64}$/i.test(proofHash)) {
        return res
          .status(400)
          .json({ error: "Invalid proofHash: expected 64-character hex string" });
      }

      if (!merkleRoot || !effectiveTenantId || !targetTenantId || !runId) {
        return res.status(400).json({
          error:
            "Missing required commitment parameters: merkleRoot, tenantId, targetTenantId, and runId are required for fail-closed verification",
        });
      }

      const secret = process.env.PROOF_COMMITMENT_SECRET ?? process.env.COOKIE_SECRET;
      if (!secret || Buffer.byteLength(secret, "utf8") < 32) {
        return res.status(503).json({ error: "Proof commitment verification is not configured" });
      }

      const expectedHash = crypto
        .createHmac("sha256", secret)
        .update(`${effectiveTenantId}:${targetTenantId}:${runId}:${merkleRoot}`)
        .digest("hex");
      const isValid = crypto.timingSafeEqual(
        Buffer.from(proofHash, "hex"),
        Buffer.from(expectedHash, "hex")
      );

      return res.json({
        data: {
          isValid,
          proofHash,
          verifiedAt: new Date().toISOString(),
          verificationMethod: "HMAC-Merkle-Exact",
          message: isValid
            ? "Cryptographic parity proof successfully verified."
            : "Verification failed: proof signature mismatch.",
        },
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to verify ZKP", 500, {
        userId: req.userId,
      });
      return;
    }
  }
);

export const zkpSyncRouter = router;
