/**
 * Admin Routes
 * Admin/debug endpoints for inspecting sagas and events
 */

import { Router } from 'express';
import { AdminService } from '../application/admin/AdminService';
import { handleRouteError } from '../utils/error-handler';

export function createAdminRouter(adminService: AdminService): Router {
  const router = Router();

  // Get saga status
  router.get('/sagas/:sagaType/:sagaId', async (req, res) => {
    try {
      const { sagaType, sagaId } = req.params;
      const status = await adminService.getSagaStatus(sagaId, sagaType);
      if (!status) {
        res.status(404).json({ error: 'Saga not found' });
        return;
      }
      res.json(status);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to get saga status', 500);
    }
  });

  // List events for aggregate
  router.get('/events/:aggregateType/:aggregateId', async (req, res) => {
    try {
      const { aggregateType, aggregateId } = req.params;
      const events = await adminService.listEventsForAggregate(
        aggregateId,
        aggregateType
      );
      res.json(events);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to get saga status', 500);
    }
  });

  // List events by correlation ID
  router.get('/events/correlation/:correlationId', async (req, res) => {
    try {
      const { correlationId } = req.params;
      const events = await adminService.listEventsByCorrelationId(correlationId);
      res.json(events);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to get saga status', 500);
    }
  });

  // Resume saga
  router.post('/sagas/:sagaType/:sagaId/resume', async (req, res) => {
    try {
      const { sagaType, sagaId } = req.params;
      await adminService.resumeSaga(sagaId, sagaType);
      res.json({ message: 'Saga resumed' });
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to get saga status', 500);
    }
  });

  // Retry saga
  router.post('/sagas/:sagaType/:sagaId/retry', async (req, res) => {
    try {
      const { sagaType, sagaId } = req.params;
      await adminService.retrySaga(sagaId, sagaType);
      res.json({ message: 'Saga retry initiated' });
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to get saga status', 500);
    }
  });

  // Cancel saga
  router.post('/sagas/:sagaType/:sagaId/cancel', async (req, res) => {
    try {
      const { sagaType, sagaId } = req.params;
      await adminService.cancelSaga(sagaId, sagaType);
      res.json({ message: 'Saga cancelled' });
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to get saga status', 500);
    }
  });

  // Get dead letter queue
  router.get('/dead-letter-queue', async (req, res) => {
    try {
      const tenantId = req.query.tenant_id as string | undefined;
      const limit = parseInt(req.query.limit as string) || 100;
      const entries = await adminService.getDeadLetterQueueEntries(
        tenantId,
        limit
      );
      res.json(entries);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to get saga status', 500);
    }
  });

  // Resolve dead letter entry
  router.post('/dead-letter-queue/:id/resolve', async (req, res) => {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      await adminService.resolveDeadLetterEntry(id, notes);
      res.json({ message: 'Entry resolved' });
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to get saga status', 500);
    }
  });

  // Dry-run reconciliation
  router.post('/dry-run', async (req, res) => {
    try {
      const { reconciliation_id, events } = req.body;
      const result = await adminService.dryRunReconciliation(
        reconciliation_id,
        events
      );
      res.json(result);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to get saga status', 500);
    }
  });

  return router;
}
