/**
 * API v2 Routes
 * Version 2 of the Settler API - Strategic Initiatives
 */

import { Router } from 'express';
import reconciliationGraphRouter from './reconciliation-graph';
import aiAgentsRouter from './ai-agents';
import networkEffectsRouter from './network-effects';
import knowledgeRouter from './knowledge';
import complianceRouter from './compliance';

export const v2Router = Router();

// Continuous Reconciliation Graph
v2Router.use('/reconciliation-graph', reconciliationGraphRouter);

// AI Agents
v2Router.use('/ai-agents', aiAgentsRouter);

// Network Effects
v2Router.use('/network-effects', networkEffectsRouter);

// Knowledge Management
v2Router.use('/knowledge', knowledgeRouter);

// Compliance
v2Router.use('/compliance', complianceRouter);

// Health check for v2
v2Router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    version: '2.0.0',
    features: [
      'continuous-reconciliation-graph',
      'ai-agents',
      'network-effects',
      'knowledge-management',
      'compliance-exports',
      'privacy-preserving-reconciliation',
    ],
  });
});
