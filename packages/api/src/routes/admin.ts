/**
 * Admin Routes
 * Admin/debug endpoints for inspecting sagas and events
 * All routes require authentication and admin permissions
 */

import { Router, Response } from "express";
import { AdminService } from "../application/admin/AdminService";
import { handleRouteError } from "../utils/error-handler";
import { enforceFreezeState } from "../middleware/governance";
import { AuthRequest } from "../middleware/auth";
import { requirePermission } from "../middleware/authorization";
import { Permission } from "../infrastructure/security/Permissions";

export function createAdminRouter(adminService: AdminService): Router {
  const router: Router = Router();

  // Get saga status
  router.get("/sagas/:sagaType/:sagaId", 
    requirePermission(Permission.ADMIN_READ),
    async (req: AuthRequest, res: Response) => {
    try {
      const { sagaType, sagaId } = req.params;
      const status = await adminService.getSagaStatus(sagaId, sagaType);
      if (!status) {
        res.status(404).json({ error: "Saga not found" });
        return;
      }
      res.json(status);
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to get saga status", 500);
    }
  });

  // List events for aggregate
  router.get("/events/:aggregateType/:aggregateId", 
    requirePermission(Permission.ADMIN_READ),
    async (req: AuthRequest, res: Response) => {
    try {
      const { aggregateType, aggregateId } = req.params;
      const events = await adminService.listEventsForAggregate(aggregateId, aggregateType);
      res.json(events);
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to get saga status", 500);
    }
  });

  // List events by correlation ID
  router.get("/events/correlation/:correlationId", 
    requirePermission(Permission.ADMIN_READ),
    async (req: AuthRequest, res: Response) => {
    try {
      const { correlationId } = req.params;
      const events = await adminService.listEventsByCorrelationId(correlationId);
      res.json(events);
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to get saga status", 500);
    }
  });

  // Resume saga
  router.post("/sagas/:sagaType/:sagaId/resume", 
    requirePermission(Permission.ADMIN_WRITE),
    enforceFreezeState(), 
    async (req: AuthRequest, res: Response) => {
    try {
      const { sagaType, sagaId } = req.params as { sagaType: string; sagaId: string };
      await adminService.resumeSaga(sagaId, sagaType);
      res.json({ message: "Saga resumed" });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to get saga status", 500);
    }
  });

  // Retry saga
  router.post("/sagas/:sagaType/:sagaId/retry", 
    requirePermission(Permission.ADMIN_WRITE),
    enforceFreezeState(), 
    async (req: AuthRequest, res: Response) => {
    try {
      const { sagaType, sagaId } = req.params;
      if (!sagaId || !sagaType) {
        return res.status(400).json({ error: "Missing required path parameters" });
      }
      await adminService.retrySaga(sagaId, sagaType);
      return res.json({ message: "Saga retry initiated" });
    } catch (error: unknown) {
      return handleRouteError(res, error, "Failed to get saga status", 500);
    }
  });

  // Cancel saga
  router.post("/sagas/:sagaType/:sagaId/cancel", 
    requirePermission(Permission.ADMIN_WRITE),
    enforceFreezeState(), 
    async (req: AuthRequest, res: Response) => {
    try {
      const { sagaType, sagaId } = req.params;
      if (!sagaId || !sagaType) {
        return res.status(400).json({ error: "Missing required path parameters" });
      }
      await adminService.cancelSaga(sagaId, sagaType);
      return res.json({ message: "Saga cancelled" });
    } catch (error: unknown) {
      return handleRouteError(res, error, "Failed to get saga status", 500);
    }
  });

  // Get dead letter queue
  router.get("/dead-letter-queue", 
    requirePermission(Permission.ADMIN_READ),
    async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.query.tenant_id as string | undefined;
      const limit = parseInt(req.query.limit as string) || 100;
      const entries = await adminService.getDeadLetterQueueEntries(tenantId, limit);
      res.json(entries);
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to get saga status", 500);
    }
  });

  // Resolve dead letter entry
  router.post("/dead-letter-queue/:id/resolve", 
    requirePermission(Permission.ADMIN_WRITE),
    enforceFreezeState(), 
    async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { notes } = req.body as { notes?: string };
      if (!id) {
        return res.status(400).json({ error: "Missing required path parameter: id" });
      }
      await adminService.resolveDeadLetterEntry(id, notes);
      return res.json({ message: "Entry resolved" });
    } catch (error: unknown) {
      return handleRouteError(res, error, "Failed to get saga status", 500);
    }
  });

  // Dry-run reconciliation
  router.post("/dry-run", 
    requirePermission(Permission.ADMIN_WRITE),
    enforceFreezeState(), 
    async (req: AuthRequest, res: Response) => {
    try {
      const { reconciliation_id, events } = req.body;
      const result = await adminService.dryRunReconciliation(reconciliation_id, events);
      res.json(result);
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to get saga status", 500);
    }
  });

  return router;
}
