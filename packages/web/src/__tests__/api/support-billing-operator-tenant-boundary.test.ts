/** @jest-environment node */

import {
  GET as getPaymentRecovery,
  POST as postPaymentRecovery,
} from "@/app/api/billing/payment-recovery/route";
import { GET as getSupportTickets } from "@/app/api/support/tickets/route";
import { GET as getConsoleSupportTickets } from "@/app/api/console/support/tickets/route";
import { GET as getOperatorControlPlane } from "@/app/api/console/operator/control-plane/route";

let isAdmin = false;
const eqCalls: Array<{ column: string; value: string }> = [];

jest.mock("@/lib/middleware/api-security", () => ({
  withSecurity: (handler: unknown) => handler,
}));

jest.mock("@/middleware/billing-gate-universal", () => ({
  withUniversalBillingGate: (handler: unknown) => handler,
}));

jest.mock("@/lib/security/billing-enforcement", () => ({
  requireActiveSubscription: jest.fn(async () => ({ allowed: true })),
}));

jest.mock("@/lib/api/auth-gate", () => ({
  requireAdmin: jest.fn(async () =>
    isAdmin
      ? { isAdmin: true }
      : {
          isAdmin: false,
          error: new Response(JSON.stringify({ error: "Forbidden" }), {
            status: 403,
            headers: { "content-type": "application/json" },
          }),
        }
  ),
}));

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(async () => ({
    auth: {
      getUser: jest.fn(async () => ({ data: { user: { id: "user-a" } } })),
      admin: {
        getUserById: jest.fn(async () => ({ data: { user: { email: "a@example.com" } } })),
      },
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn((column: string, value: string) => {
          eqCalls.push({ column, value });
          return {
            eq: jest.fn(() => ({
              order: jest.fn(() => ({
                limit: jest.fn(async () => ({ data: [], error: null })),
              })),
              limit: jest.fn(async () => ({ data: [], error: null })),
              single: jest.fn(async () => ({ data: null })),
            })),
            order: jest.fn(() => ({
              limit: jest.fn(async () => ({ data: [], error: null })),
            })),
            limit: jest.fn(async () => ({ data: [], error: null })),
          };
        }),
      })),
      insert: jest.fn(async () => ({ error: null })),
      update: jest.fn(() => ({ eq: jest.fn(async () => ({ error: null })) })),
    })),
  })),
}));

jest.mock("@/shared/db/prismaClient", () => ({
  prisma: {
    $queryRaw: jest.fn(async () => []),
    $executeRaw: jest.fn(async () => 1),
    auditLog: {
      findMany: jest.fn(async () => []),
    },
  },
}));

function req(url: string, body?: unknown) {
  return {
    url,
    headers: new Headers(),
    nextUrl: new URL(url),
    json: async () => body ?? {},
  } as any;
}

describe("support/billing/operator boundary coverage", () => {
  beforeEach(() => {
    isAdmin = false;
    eqCalls.length = 0;
  });

  it("api.billing.payment_recovery.cross_user_denied", async () => {
    const response = await getPaymentRecovery(
      req("http://localhost/api/billing/payment-recovery?userId=user-b")
    );
    expect(response.status).toBe(403);
    const payload = await response.json();
    expect(JSON.stringify(payload)).not.toContain("user-b");
  });

  it("api.billing.payment_recovery.post.cross_user_denied", async () => {
    const response = await postPaymentRecovery(
      req("http://localhost/api/billing/payment-recovery", { userId: "user-b" })
    );
    expect(response.status).toBe(403);
    const payload = await response.json();
    expect(JSON.stringify(payload)).not.toContain("user-b");
  });

  it("api.support.tickets.admin_inbox_non_admin_denied_no_leak", async () => {
    const response = await getSupportTickets(
      req("http://localhost/api/support/tickets?tenantId=tenant-b")
    );
    expect(response.status).toBe(403);
    const payload = await response.json();
    expect(JSON.stringify(payload)).not.toContain("tenant-b");
  });

  it("api.console.support_tickets.non_admin_denied_no_leak", async () => {
    const response = await getConsoleSupportTickets(
      req("http://localhost/api/console/support/tickets?tenantId=tenant-b")
    );
    expect(response.status).toBe(403);
    const payload = await response.json();
    expect(JSON.stringify(payload)).not.toContain("tenant-b");
  });

  it("api.console.operator_control_plane.non_admin_denied_no_leak", async () => {
    const response = await getOperatorControlPlane(
      req("http://localhost/api/console/operator/control-plane?tenantId=tenant-b")
    );
    expect(response.status).toBe(403);
    const payload = await response.json();
    expect(JSON.stringify(payload)).not.toContain("tenant-b");
  });
});
