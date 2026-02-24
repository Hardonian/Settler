/**
 * Evidence & Traceability Service
 *
 * Provides comprehensive audit trail for reconciliation decisions:
 * - Rule ID + version tracking per match
 * - Actor tracking (system vs human)
 * - Status transition logging
 * - Evidence chain normalization
 *
 * Part of Phase III: Evidence & Traceability
 *
 * NOTE: This service is currently a stub. The ExecutionProvenance model
 * referenced in this code does not exist in the Prisma schema.
 * These methods will log warnings instead of persisting data.
 */

import { PrismaClient } from "@prisma/client";
import { type DeterministicMatch } from "./deterministic-types";

/**
 * Provenance service for recording execution evidence
 */
export class ProvenanceService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Record a match creation event
   * STUB: ExecutionProvenance table does not exist in schema
   */
  async recordMatch(
    _runResultId: string,
    _snapshotId: string,
    _match: DeterministicMatch,
    _sequence: number
  ): Promise<void> {
    // Stub - provenance recording not implemented
    // The ExecutionProvenance model does not exist in the Prisma schema
  }

  /**
   * Record a review decision
   * STUB: ExecutionProvenance table does not exist in schema
   */
  async recordReviewDecision(
    _runResultId: string,
    _snapshotId: string,
    _matchId: string,
    _decision: "approved" | "rejected" | "override",
    _actor: "system" | "human",
    _actorUserId: string | undefined,
    _reason: string,
    _sequence: number
  ): Promise<void> {
    // Stub - provenance recording not implemented
  }

  /**
   * Record run status transition
   * STUB: ExecutionProvenance table does not exist in schema
   */
  async recordStatusTransition(
    _runResultId: string,
    _snapshotId: string,
    _fromStatus: string,
    _toStatus: string,
    _actor: "system" | "human",
    _actorUserId: string | undefined,
    _reason: string,
    _sequence: number
  ): Promise<void> {
    // Stub - provenance recording not implemented
  }

  /**
   * Query provenance records for a run
   * STUB: ExecutionProvenance table does not exist in schema
   */
  async getProvenanceForRun(_runResultId: string): Promise<unknown[]> {
    // Stub - returns empty array
    return [];
  }

  /**
   * Query provenance records by entity
   * STUB: ExecutionProvenance table does not exist in schema
   */
  async getProvenanceForEntity(
    _runResultId: string,
    _entityId: string
  ): Promise<unknown[]> {
    // Stub - returns empty array
    return [];
  }
}
