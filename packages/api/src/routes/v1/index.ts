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

export const v1Router = Router();

// Mount v1 routes
v1Router.use('/webhooks/receive', webhookReceiveRouter);
v1Router.use('/realtime', realtimeRouter);
v1Router.use('/reconciliations', reconciliationSummaryRouter);

// Canonical data model routes
v1Router.use('/transactions', transactionsRouter);
v1Router.use('/settlements', settlementsRouter);
v1Router.use('/fees', feesRouter);
v1Router.use('/exports', exportsRouter);
v1Router.use('/currency', currencyRouter);

// Health check
v1Router.get('/health', (_req, res) => {
  res.json({
    version: '1.0.0',
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});
