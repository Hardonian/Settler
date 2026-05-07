/**
 * Cost Control Service
 *
 * PHASE 1: Cost Surface & Marginal Cost Audit
 *
 * Enumerates all cost drivers and implements:
 * - Hard caps per tenant
 * - Backpressure mechanisms
 * - Degradation paths
 * - Abuse scenario mitigation
 *
 * Goal: Marginal cost per tenant trends downward, no single tenant can spike global cost
 */

export * from "./types";
export * from "./constants";
export * from "./CostControlService";

import { CostControlService } from "./CostControlService";

export const costControlService = new CostControlService();
