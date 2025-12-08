/**
 * Create Job Command
 * CQRS Command for creating a reconciliation job
 */

import { ReconciliationRules } from '../../domain/entities/Job';

export interface CreateJobCommand {
  userId: string;
  name: string;
  sourceAdapter: string;
  sourceConfig: Record<string, unknown>;
  targetAdapter: string;
  targetConfig: Record<string, unknown>;
  rules: ReconciliationRules;
  schedule?: string;
}

export interface CreateJobCommandResult {
  jobId: string;
  name: string;
  status: string;
}
