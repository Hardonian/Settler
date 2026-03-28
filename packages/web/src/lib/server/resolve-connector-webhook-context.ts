import type { SupabaseClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

import { appLogger } from "@/lib/utils/logger";

type ConnectorWebhookRow = { id: string; tenant_id: string };

function asConnectorWebhookRow(value: unknown): ConnectorWebhookRow | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const o = value as Record<string, unknown>;
  if (typeof o.id !== "string" || typeof o.tenant_id !== "string") {
    return null;
  }
  return { id: o.id, tenant_id: o.tenant_id };
}

/**
 * Resolve tenant + connector for an inbound provider webhook.
 * Prefer explicit `x-tenant-id` when multiple connectors share the same provider_id (fail-closed on mismatch).
 */
export async function resolveConnectorWebhookContext(
  admin: SupabaseClient,
  providerId: string,
  request: NextRequest
): Promise<
  | { ok: true; tenantId: string; connectorId: string }
  | { ok: false; code: string; message: string; status: number }
> {
  const normalizedProvider = providerId.trim().toLowerCase();
  const headerTenant =
    request.headers.get("x-tenant-id")?.trim() || request.headers.get("x-settler-tenant-id")?.trim();

  if (headerTenant) {
    const { data: row, error } = await admin
      .from("connectors")
      .select("id, tenant_id")
      .eq("tenant_id", headerTenant)
      .eq("provider_id", normalizedProvider)
      .limit(1)
      .maybeSingle();

    if (error) {
      appLogger.error("Connector lookup failed for webhook (tenant header)", error, {
        providerId: normalizedProvider,
      });
      return {
        ok: false,
        code: "CONNECTOR_LOOKUP_FAILED",
        message: "Could not resolve connector for this tenant",
        status: 503,
      };
    }

    if (!row) {
      appLogger.warn("Webhook x-tenant-id does not match a connector for provider", {
        providerId: normalizedProvider,
        tenantId: headerTenant,
      });
      return {
        ok: false,
        code: "TENANT_CONNECTOR_MISMATCH",
        message: "Tenant does not have this connector provisioned",
        status: 403,
      };
    }

    const typed = asConnectorWebhookRow(row);
    if (!typed) {
      return {
        ok: false,
        code: "CONNECTOR_LOOKUP_INVALID",
        message: "Connector record shape invalid",
        status: 503,
      };
    }
    return { ok: true, tenantId: typed.tenant_id, connectorId: typed.id };
  }

  const { data: rows, error: listError } = await admin
    .from("connectors")
    .select("id, tenant_id")
    .eq("provider_id", normalizedProvider)
    .limit(3);

  if (listError) {
    appLogger.error("Connector listing failed for webhook", listError, {
      providerId: normalizedProvider,
    });
    return {
      ok: false,
      code: "CONNECTOR_LOOKUP_FAILED",
      message: "Could not resolve connector",
      status: 503,
    };
  }

  if (!rows?.length) {
    return {
      ok: false,
      code: "CONNECTOR_NOT_PROVISIONED",
      message: `No connector registered for provider ${normalizedProvider}. Provision the connector or send x-tenant-id.`,
      status: 503,
    };
  }

  if (rows.length > 1) {
    return {
      ok: false,
      code: "TENANT_AMBIGUOUS",
      message:
        "Multiple tenants use this provider; send x-tenant-id header so the event is attributed correctly",
      status: 400,
    };
  }

  const only = asConnectorWebhookRow(rows[0]);
  if (!only) {
    return {
      ok: false,
      code: "CONNECTOR_LOOKUP_INVALID",
      message: "Connector record shape invalid",
      status: 503,
    };
  }
  return { ok: true, tenantId: only.tenant_id, connectorId: only.id };
}
