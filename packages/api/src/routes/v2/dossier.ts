/**
 * Cryptographic Audit Dossier Routes (API v2)
 *
 * REST API for generating and retrieving formal auditor attestation dossiers,
 * including 100% census reconciliation population reports, Merkle state roots,
 * and client-side WASM zero-trust verification scripts.
 */

import { Router, Request, Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth";
import { geminiCognitiveEngine } from "@settler/reconciliation-core";
import { handleRouteError } from "../../utils/error-handler";

export const dossierRouter: Router = Router();

// In-memory tenant-isolated dossier store (backed by engine)
const dossierStore = new Map<string, any>();

/**
 * POST /api/v2/audit/dossier/generate
 * Synthesize an auditor attestation dossier with cryptographic proofs
 */
dossierRouter.post(
  "/generate",
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const tenantId = authReq.tenantId ?? (authReq.user as any)?.tenantId ?? req.body?.tenantId;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: "Tenant context is required",
        });
        return;
      }

      // Cross-tenant guard
      if (authReq.tenantId && req.body?.tenantId && req.body.tenantId !== authReq.tenantId) {
        res.status(403).json({
          success: false,
          error: "Tenant mismatch",
        });
        return;
      }

      const {
        query = "Comprehensive census settlement audit",
        reportingPeriod = {
          from: new Date(Date.now() - 30 * 86400000).toISOString(),
          to: new Date().toISOString(),
        },
        reconciliationRuns = [],
      } = req.body;

      const formattedRuns = (Array.isArray(reconciliationRuns) ? reconciliationRuns : []).map(
        (r: any) => ({
          ...r,
          totalVolumeCents: BigInt(r.totalVolumeCents ?? 0),
        })
      );

      const dossier = geminiCognitiveEngine.synthesizeAuditProofDossier({
        tenantId,
        query,
        reportingPeriod,
        reconciliationRuns: formattedRuns,
      });

      // Persist in tenant-keyed store
      dossierStore.set(`${tenantId}:${dossier.dossierId}`, dossier);

      const serialized = JSON.parse(
        JSON.stringify(dossier, (_, v) => (typeof v === "bigint" ? v.toString() : v))
      );

      res.status(200).json({
        success: true,
        data: serialized,
      });
    } catch (error) {
      handleRouteError(res, error, "Failed to generate audit dossier");
    }
  }
);

/**
 * GET /api/v2/audit/dossier/:dossierId
 * Retrieve an existing audit dossier by ID
 */
dossierRouter.get(
  "/:dossierId",
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const tenantId =
        authReq.tenantId ?? (authReq.user as any)?.tenantId ?? (req.query?.tenantId as string);

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: "Tenant context is required",
        });
        return;
      }

      const dossierId = String(req.params.dossierId ?? "");
      const dossier = dossierStore.get(`${tenantId}:${dossierId}`);

      if (!dossier) {
        res.status(404).json({
          success: false,
          error: "Audit dossier not found",
        });
        return;
      }

      const serialized = JSON.parse(
        JSON.stringify(dossier, (_, v) => (typeof v === "bigint" ? v.toString() : v))
      );

      res.status(200).json({
        success: true,
        data: serialized,
      });
    } catch (error) {
      handleRouteError(res, error, "Failed to retrieve audit dossier");
    }
  }
);
