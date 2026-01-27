/**
 * Receipts Service
 *
 * Creates and manages tamper-evident receipts with hash chains.
 */

import { createClient } from "@/lib/supabase/server";
import { createHash } from "crypto";
import type { Receipt, TenantId, Evidence } from "@/lib/domain/types";
import type { Database } from "@/types/database.types";
import { safeLogger } from "@/lib/observability/safe-logger";

/**
 * Canonicalize JSON for stable hashing
 * Sorts keys recursively to ensure consistent hash
 */
function canonicalizeJson(obj: Record<string, unknown>): string {
  if (obj === null || typeof obj !== "object") {
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    return `[${obj.map((item) => canonicalizeJson(item as Record<string, unknown>)).join(",")}]`;
  }

  const sortedKeys = Object.keys(obj).sort();
  const canonical: Record<string, unknown> = {};

  for (const key of sortedKeys) {
    const value = obj[key];
    if (value !== undefined) {
      if (typeof value === "object" && value !== null) {
        canonical[key] = JSON.parse(canonicalizeJson(value as Record<string, unknown>));
      } else {
        canonical[key] = value;
      }
    }
  }

  return JSON.stringify(canonical);
}

/**
 * Calculate SHA256 hash of canonical JSON
 */
function calculateHash(canonicalJson: string): string {
  return createHash("sha256").update(canonicalJson).digest("hex");
}

/**
 * Get previous receipt hash for chain
 */
async function getPreviousReceiptHash(
  supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never,
  tenantId: TenantId,
  sourceId?: string
): Promise<string | undefined> {
  try {
    let query = supabase
      .from("receipts")
      .select("hash")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (sourceId) {
      query = query.eq("source_id", sourceId);
    }

    type ReceiptRow = Database["public"]["Tables"]["receipts"]["Row"];
    const { data } = (await query.maybeSingle()) as { data: ReceiptRow | null };
    return data?.hash;
  } catch {
    await safeLogger.error("[getPreviousReceiptHash] Error", {
      tenantId,
      sourceId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return undefined;
  }
}

/**
 * Create a receipt with hash chain
 */
export async function createReceipt(
  tenantId: TenantId,
  payload: {
    sourceId?: string;
    canonicalJson: Record<string, unknown>;
    evidenceRefs: Evidence[];
    narrative: {
      summary: string;
      whyItMatters: string;
      nextSteps?: string;
    };
  }
): Promise<Receipt | null> {
  try {
    const supabase = await createClient();

    // Verify tenant access
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      await safeLogger.warn("[createReceipt] User not authenticated", { tenantId });
      return null;
    }

    // Set tenant context for RLS
    try {
      await (supabase.rpc as any)("set_tenant_context", { tenant_id: tenantId });
    } catch {
      // RPC might not exist, continue anyway
    }

    // Canonicalize JSON
    const canonicalJsonStr = canonicalizeJson(payload.canonicalJson);

    // Calculate hash
    const hash = calculateHash(canonicalJsonStr);

    // Get previous hash for chain
    const prevHash = await getPreviousReceiptHash(supabase, tenantId, payload.sourceId);

    // Insert receipt
    type ReceiptRow = Database["public"]["Tables"]["receipts"]["Row"];
    type ReceiptInsert = Database["public"]["Tables"]["receipts"]["Insert"];
    const { data: receipt, error } = (await (supabase.from("receipts") as any)
      .insert({
        tenant_id: tenantId,
        source_id: payload.sourceId,
        canonical_json: payload.canonicalJson,
        hash,
        prev_hash: prevHash,
        evidence_refs: payload.evidenceRefs,
        summary: payload.narrative.summary,
        why_it_matters: payload.narrative.whyItMatters,
        next_steps: payload.narrative.nextSteps,
        created_by: user.id,
      } as ReceiptInsert)
      .select()
      .single()) as { data: ReceiptRow | null; error: any };

    if (error || !receipt) {
      await safeLogger.error("[createReceipt] Error", {
        tenantId,
        error: error?.message || String(error),
      });
      return null;
    }

    return {
      id: receipt.id,
      tenantId,
      sourceId: receipt.source_id ?? undefined,
      canonicalJson: receipt.canonical_json as Record<string, unknown>,
      hash: receipt.hash,
      prevHash: receipt.prev_hash ?? undefined,
      evidenceRefs: receipt.evidence_refs as Evidence[],
      narrative: {
        summary: receipt.summary,
        whyItMatters: receipt.why_it_matters,
        nextSteps: receipt.next_steps ?? undefined,
      },
      createdBy: receipt.created_by,
      createdAt: new Date(receipt.created_at),
    };
  } catch {
    await safeLogger.error("[createReceipt] Unexpected error", {
      tenantId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return null;
  }
}

/**
 * Verify receipt hash chain integrity
 */
export async function verifyReceiptChain(
  tenantId: TenantId,
  receiptId: string
): Promise<{ valid: boolean; issues: string[] }> {
  try {
    const supabase = await createClient();

    // Verify tenant access
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { valid: false, issues: ["User not authenticated"] };
    }

    // Set tenant context for RLS
    try {
      await (supabase.rpc as any)("set_tenant_context", { tenant_id: tenantId });
    } catch {
      // RPC might not exist, continue anyway
    }

    type ReceiptRow = Database["public"]["Tables"]["receipts"]["Row"];
    const { data: receipt, error } = (await supabase
      .from("receipts")
      .select("*")
      .eq("id", receiptId)
      .eq("tenant_id", tenantId)
      .single()) as { data: ReceiptRow | null; error: any };

    if (error || !receipt) {
      return { valid: false, issues: ["Receipt not found"] };
    }

    const issues: string[] = [];

    // Verify current receipt hash
    const canonicalJsonStr = canonicalizeJson(receipt.canonical_json as Record<string, unknown>);
    const expectedHash = calculateHash(canonicalJsonStr);
    if (receipt.hash !== expectedHash) {
      issues.push("Receipt hash mismatch - data may have been tampered with");
    }

    // Verify chain link
    if (receipt.prev_hash) {
      type ReceiptRow = Database["public"]["Tables"]["receipts"]["Row"];
      const { data: prevReceipt } = (await supabase
        .from("receipts")
        .select("hash")
        .eq("hash", receipt.prev_hash)
        .eq("tenant_id", tenantId)
        .maybeSingle()) as { data: ReceiptRow | null };

      if (!prevReceipt) {
        issues.push("Previous receipt hash not found - chain may be broken");
      }
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  } catch {
    await safeLogger.error("[verifyReceiptChain] Unexpected error", {
      tenantId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return { valid: false, issues: ["Verification error"] };
  }
}

/**
 * List receipts for a tenant
 */
export async function listReceipts(tenantId: TenantId, limit: number = 50): Promise<Receipt[]> {
  try {
    const supabase = await createClient();

    // Verify tenant access
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      await safeLogger.warn("[listReceipts] User not authenticated", { tenantId });
      return [];
    }

    // Set tenant context for RLS
    try {
      await (supabase.rpc as any)("set_tenant_context", { tenant_id: tenantId });
    } catch {
      // RPC might not exist, continue anyway
    }

    type ReceiptRow = Database["public"]["Tables"]["receipts"]["Row"];
    const { data: receipts, error } = (await supabase
      .from("receipts")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(Math.min(limit, 100))) as { data: ReceiptRow[] | null; error: any };

    if (error) {
      await safeLogger.error("[listReceipts] Error", {
        tenantId,
        error: error.message || String(error),
      });
      return [];
    }

    return (receipts ?? []).map((r) => ({
      id: r.id,
      tenantId: r.tenant_id,
      sourceId: r.source_id ?? undefined,
      canonicalJson: r.canonical_json as Record<string, unknown>,
      hash: r.hash,
      prevHash: r.prev_hash ?? undefined,
      evidenceRefs: r.evidence_refs as Evidence[],
      narrative: {
        summary: r.summary,
        whyItMatters: r.why_it_matters,
        nextSteps: r.next_steps ?? undefined,
      },
      createdBy: r.created_by,
      createdAt: new Date(r.created_at),
    }));
  } catch {
    await safeLogger.error("[listReceipts] Unexpected error", {
      tenantId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return [];
  }
}
