/**
 * Role-Based Access Control (RBAC) Audit Trail
 *
 * Implements tamper-evident, hash-chained audit logging for all operator actions,
 * permission grants, role modifications, and ledger overrides.
 *
 * Backed by continuous SHA-256 hash chaining (blockchain-style tamper detection).
 */

import { createHash } from "node:crypto";

export interface RbacAuditRecord {
  recordId: string;
  tenantId: string;
  actorId: string;
  actorRole: string;
  action: string;
  targetResource: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
  previousRecordHash: string;
  recordHash: string;
}

export function computeRecordHash(
  tenantId: string,
  actorId: string,
  action: string,
  targetResource: string,
  timestamp: string,
  previousRecordHash: string
): string {
  const preimage = Buffer.concat([
    Buffer.from([0x00]),
    Buffer.from(
      `${tenantId}|${actorId}|${action}|${targetResource}|${timestamp}|${previousRecordHash}`
    ),
  ]);
  return createHash("sha256").update(preimage).digest("hex");
}

export class RbacAuditTrail {
  private chain: RbacAuditRecord[] = [];
  private lastHash: string = "0".repeat(64); // Genesis hash

  constructor(private readonly tenantId: string) {
    if (!tenantId || tenantId.trim() === "") {
      throw new Error("Tenant context invariant violation: tenantId is required");
    }
  }

  append(
    actorId: string,
    actorRole: string,
    action: string,
    targetResource: string,
    metadata?: Record<string, unknown>
  ): RbacAuditRecord {
    const timestamp = new Date().toISOString();
    const previousRecordHash = this.lastHash;
    const recordHash = computeRecordHash(
      this.tenantId,
      actorId,
      action,
      targetResource,
      timestamp,
      previousRecordHash
    );

    const record: RbacAuditRecord = {
      recordId: `audit_${this.tenantId}_${this.chain.length + 1}`,
      tenantId: this.tenantId,
      actorId,
      actorRole,
      action,
      targetResource,
      metadata,
      timestamp,
      previousRecordHash,
      recordHash,
    };

    this.chain.push(record);
    this.lastHash = recordHash;
    return record;
  }

  getRecords(): readonly RbacAuditRecord[] {
    return this.chain;
  }

  /**
   * Verifies the cryptographic integrity of the entire audit chain.
   */
  verifyChain(): { valid: boolean; corruptedIndex?: number; reason?: string } {
    let expectedPrev = "0".repeat(64);

    for (let i = 0; i < this.chain.length; i++) {
      const rec = this.chain[i]!;

      if (rec.tenantId !== this.tenantId) {
        return {
          valid: false,
          corruptedIndex: i,
          reason: `Tenant mismatch: expected ${this.tenantId}, found ${rec.tenantId}`,
        };
      }

      if (rec.previousRecordHash !== expectedPrev) {
        return {
          valid: false,
          corruptedIndex: i,
          reason: `Broken chain link at index ${i}: expected prev hash ${expectedPrev}, found ${rec.previousRecordHash}`,
        };
      }

      const recomputed = computeRecordHash(
        rec.tenantId,
        rec.actorId,
        rec.action,
        rec.targetResource,
        rec.timestamp,
        rec.previousRecordHash
      );

      if (recomputed !== rec.recordHash) {
        return {
          valid: false,
          corruptedIndex: i,
          reason: `Payload hash tampering at index ${i}`,
        };
      }

      expectedPrev = rec.recordHash;
    }

    return { valid: true };
  }
}
