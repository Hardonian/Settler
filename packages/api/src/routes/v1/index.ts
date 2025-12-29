/**
 * API v1 Routes
 * Version 1 of the Settler API
 */

import { Router } from 'express';
import { realtimeRouter } from '../realtime';
import { reconciliationSummaryRouter } from '../reconciliation-summary';
import transactionsRouter from './transactions';
import settlementsRouter from './settlements';
import feesRouter from './fees';
import exportsRouter from './exports';
import currencyRouter from './currency';
import webhookReceiveRouter from './webhooks/receive';
import webhookEventsRouter from './webhooks/events';
import ingestionRouter from './ingestion';
import reconciliationRouter from './reconciliation';
import ingestionExportsRouter from './ingestion-exports';
import { operatorModeRouter } from './operator-mode';
import multiSourceReconciliationRouter from './multi-source-reconciliation';
import approvalsRouter from './approvals';
import progressRouter from './progress';
import notificationsRouter from './notifications';
import receiptMatchingRouter from './receipt-matching';
import bulkOperationsRouter from './bulk-operations';
import slaRouter from './sla';
import auditTrailRouter from './audit-trail';
import advancedMatchingRulesRouter from './advanced-matching-rules';
import customIntegrationsRouter from './custom-integrations';
import dedicatedInfrastructureRouter from './dedicated-infrastructure';
import automatedReviewRouter from './automated-review';

export const v1Router = Router();

// Mount v1 routes
v1Router.use('/webhooks/receive', webhookReceiveRouter);
v1Router.use('/webhooks', webhookEventsRouter); // Events discovery endpoint
v1Router.use('/realtime', realtimeRouter);
v1Router.use('/reconciliations', reconciliationSummaryRouter);

// Canonical data model routes
v1Router.use('/transactions', transactionsRouter);
v1Router.use('/settlements', settlementsRouter);
v1Router.use('/fees', feesRouter);
v1Router.use('/exports', exportsRouter);
v1Router.use('/currency', currencyRouter);

// Ingestion pipeline routes
v1Router.use('/ingestion', ingestionRouter);
v1Router.use('/reconciliation', reconciliationRouter);
v1Router.use('/ingestion/exports', ingestionExportsRouter);
v1Router.use('/automated-review', automatedReviewRouter);

// Phase 1: Core Features
v1Router.use('/multi-source-reconciliation', multiSourceReconciliationRouter);
v1Router.use('/approvals', approvalsRouter);
v1Router.use('/progress', progressRouter);
v1Router.use('/notifications', notificationsRouter);
v1Router.use('/audit-trail', auditTrailRouter);

// Phase 2: Premium Features
v1Router.use('/receipt-matching', receiptMatchingRouter);
v1Router.use('/bulk-operations', bulkOperationsRouter);
v1Router.use('/advanced-matching-rules', advancedMatchingRulesRouter);
// Currency routes already exist at /currency

// Phase 3: Enterprise Features
v1Router.use('/sla', slaRouter);
v1Router.use('/custom-integrations', customIntegrationsRouter);
v1Router.use('/dedicated-infrastructure', dedicatedInfrastructureRouter);

// Operator mode routes
v1Router.use('/', operatorModeRouter);

// Health check
v1Router.get('/health', (_req, res) => {
  res.json({
    version: '1.0.0',
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});
