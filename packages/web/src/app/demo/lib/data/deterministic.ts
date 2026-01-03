/**
 * Deterministic Utilities
 * 
 * Provides deterministic hashing and ID generation for demo data.
 * All functions are pure and produce the same output for the same input.
 */

import { createHash } from "crypto";

/**
 * Generate a deterministic SHA-256 hash
 */
export function deterministicHash(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

/**
 * Generate a deterministic ID from a seed
 */
export function deterministicId(seed: string, prefix = "demo"): string {
  const hash = deterministicHash(seed);
  return `${prefix}_${hash.substring(0, 16)}`;
}

/**
 * Generate a deterministic audit trail ID
 */
export function deterministicAuditTrailId(entityId: string, action: string): string {
  return deterministicId(`${entityId}_${action}`, "audit");
}

/**
 * Normalize a transaction for hashing
 */
export function normalizeTransactionForHash(transaction: unknown): string {
  // Sort keys and stringify deterministically
  return JSON.stringify(transaction, Object.keys(transaction as Record<string, unknown>).sort());
}

/**
 * Generate deterministic hash for a transaction
 */
export function hashTransaction(transaction: unknown): string {
  const normalized = normalizeTransactionForHash(transaction);
  return deterministicHash(normalized);
}

/**
 * Generate deterministic timestamp (fixed for demo)
 */
export function deterministicTimestamp(offsetDays = 0): string {
  // Use a fixed base date for reproducibility
  const baseDate = new Date("2024-01-15T10:00:00Z");
  const date = new Date(baseDate.getTime() + offsetDays * 24 * 60 * 60 * 1000);
  return date.toISOString();
}
