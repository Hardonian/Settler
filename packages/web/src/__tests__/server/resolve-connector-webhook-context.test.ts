/** @jest-environment node */

import { NextRequest } from "next/server";
import { resolveConnectorWebhookContext } from "@/lib/server/resolve-connector-webhook-context";

function makeRequest(headers: Record<string, string>): NextRequest {
  return new NextRequest("https://example.com/webhook", { headers });
}

type QueryResult = { data: unknown; error: Error | null };

/**
 * Minimal Supabase chain: list path ends with await after .limit();
 * header path ends with .maybeSingle().
 */
function createMockAdmin(calls: Array<{ mode: "list" | "header"; result: QueryResult }>) {
  let i = 0;
  return {
    from(_table: string) {
      const spec = calls[i++];
      if (!spec) {
        throw new Error("mock admin: no more configured calls");
      }
      const r = spec.result;
      if (spec.mode === "list") {
        return {
          select: () => ({
            eq: () => ({
              limit: () => Promise.resolve(r),
            }),
          }),
        };
      }
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              limit: () => ({
                maybeSingle: async () => r,
              }),
            }),
          }),
        }),
      };
    },
  };
}

describe("resolveConnectorWebhookContext", () => {
  it("resolves single connector row without tenant header", async () => {
    const admin = createMockAdmin([
      {
        mode: "list",
        result: { data: [{ id: "c1", tenant_id: "t1" }], error: null },
      },
    ]);
    const r = await resolveConnectorWebhookContext(admin as never, "stripe", makeRequest({}));
    expect(r).toEqual({ ok: true, tenantId: "t1", connectorId: "c1" });
  });

  it("returns TENANT_AMBIGUOUS when multiple rows and no header", async () => {
    const admin = createMockAdmin([
      {
        mode: "list",
        result: {
          data: [
            { id: "c1", tenant_id: "t1" },
            { id: "c2", tenant_id: "t2" },
          ],
          error: null,
        },
      },
    ]);
    const r = await resolveConnectorWebhookContext(admin as never, "stripe", makeRequest({}));
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.code).toBe("TENANT_AMBIGUOUS");
      expect(r.status).toBe(400);
    }
  });

  it("returns 404 when no connector rows", async () => {
    const admin = createMockAdmin([{ mode: "list", result: { data: [], error: null } }]);
    const r = await resolveConnectorWebhookContext(admin as never, "stripe", makeRequest({}));
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.code).toBe("CONNECTOR_NOT_PROVISIONED");
      expect(r.status).toBe(404);
    }
  });

  it("returns 403 when x-tenant-id does not match a row", async () => {
    const admin = createMockAdmin([{ mode: "header", result: { data: null, error: null } }]);
    const r = await resolveConnectorWebhookContext(
      admin as never,
      "stripe",
      makeRequest({ "x-tenant-id": "unknown-tenant" })
    );
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.code).toBe("TENANT_CONNECTOR_MISMATCH");
      expect(r.status).toBe(403);
    }
  });

  it("accepts x-settler-tenant-id alias", async () => {
    const admin = createMockAdmin([
      {
        mode: "header",
        result: { data: { id: "cx", tenant_id: "tx" }, error: null },
      },
    ]);
    const r = await resolveConnectorWebhookContext(
      admin as never,
      "stripe",
      makeRequest({ "x-settler-tenant-id": "tx" })
    );
    expect(r).toEqual({ ok: true, tenantId: "tx", connectorId: "cx" });
  });
});
