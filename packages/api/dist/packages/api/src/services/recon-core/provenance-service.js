"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProvenanceService = void 0;
/**
 * Provenance service for recording execution evidence
 */
class ProvenanceService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * Record a match creation event
     * STUB: ExecutionProvenance table does not exist in schema
     */
    async recordMatch(_runResultId, _snapshotId, _match, _sequence) {
        // Stub - provenance recording not implemented
        // The ExecutionProvenance model does not exist in the Prisma schema
    }
    /**
     * Record a review decision
     * STUB: ExecutionProvenance table does not exist in schema
     */
    async recordReviewDecision(_runResultId, _snapshotId, _matchId, _decision, _actor, _actorUserId, _reason, _sequence) {
        // Stub - provenance recording not implemented
    }
    /**
     * Record run status transition
     * STUB: ExecutionProvenance table does not exist in schema
     */
    async recordStatusTransition(_runResultId, _snapshotId, _fromStatus, _toStatus, _actor, _actorUserId, _reason, _sequence) {
        // Stub - provenance recording not implemented
    }
    /**
     * Query provenance records for a run
     * STUB: ExecutionProvenance table does not exist in schema
     */
    async getProvenanceForRun(_runResultId) {
        // Stub - returns empty array
        return [];
    }
    /**
     * Query provenance records by entity
     * STUB: ExecutionProvenance table does not exist in schema
     */
    async getProvenanceForEntity(_runResultId, _entityId) {
        // Stub - returns empty array
        return [];
    }
}
exports.ProvenanceService = ProvenanceService;
//# sourceMappingURL=provenance-service.js.map