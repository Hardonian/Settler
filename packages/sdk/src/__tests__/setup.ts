/**
 * Jest global setup: mock `fetch` for api.settler.dev so HTTP client tests never hit the network.
 * MSW v2 pulls ESM-only transitive deps that break ts-jest's default transform pipeline; a small
 * fetch stub keeps the harness honest without fighting Jest + pnpm layout.
 */
import { beforeAll, afterAll } from "@jest/globals";
import { mockJob } from "./fixtures";

const API_BASE = "https://api.settler.dev";

let realFetch: typeof globalThis.fetch;

function json(data: unknown, status = 200, headers?: Record<string, string>): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}

async function readJsonBody(init?: RequestInit): Promise<Record<string, unknown>> {
  const raw = init?.body;
  if (raw == null || raw === "") {
    return {};
  }
  if (typeof raw === "string") {
    try {
      const o = JSON.parse(raw) as unknown;
      return o && typeof o === "object" && !Array.isArray(o) ? (o as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  }
  return {};
}

function matchPath(pathname: string, pattern: string): RegExpMatchArray | null {
  const re = new RegExp("^" + pattern.replace(/:[^/]+/g, "([^/]+)") + "$");
  return pathname.match(re);
}

async function handleFetch(input: string | URL | Request, init?: RequestInit): Promise<Response> {
  const url = input instanceof Request ? new URL(input.url) : new URL(String(input));
  if (
    url.origin + url.pathname === API_BASE + "/api/v1/jobs" &&
    url.search === "" &&
    (init?.method ?? "GET") === "GET"
  ) {
    return json({
      data: [
        {
          id: "job_123",
          userId: "user_123",
          name: mockJob.name,
          source: { adapter: "shopify", config: {} },
          target: { adapter: "stripe", config: {} },
          rules: { matching: [] },
          status: "active",
          createdAt: "2026-01-15T10:00:00Z",
          updatedAt: "2026-01-15T10:00:00Z",
        },
      ],
      count: 1,
    });
  }

  const method = init?.method ?? "GET";
  const p = url.pathname;

  const jobGet = matchPath(p, "/api/v1/jobs/([^/]+)");
  if (jobGet && method === "GET" && !p.includes("/run")) {
    const id = jobGet[1];
    return json({
      data: {
        id,
        userId: "user_123",
        name: mockJob.name,
        source: { adapter: "shopify", config: {} },
        target: { adapter: "stripe", config: {} },
        rules: { matching: [] },
        status: "active",
        createdAt: "2026-01-15T10:00:00Z",
        updatedAt: "2026-01-15T10:00:00Z",
      },
    });
  }

  if (p === "/api/v1/jobs" && method === "POST") {
    const bodyObj = await readJsonBody(init);
    return json(
      {
        data: Object.assign(
          {
            id: "job_new",
            userId: "user_123",
            status: "active",
            createdAt: "2026-01-15T10:00:00Z",
            updatedAt: "2026-01-15T10:00:00Z",
          },
          bodyObj
        ),
        message: "Reconciliation job created successfully",
      },
      201
    );
  }

  const runMatch = matchPath(p, "/api/v1/jobs/([^/]+)/run");
  if (runMatch && method === "POST") {
    return json({
      data: {
        id: "exec_123",
        jobId: runMatch[1],
        status: "running",
        startedAt: "2026-01-15T10:00:00Z",
      },
      message: "Job execution started",
    });
  }

  const delJob = matchPath(p, "/api/v1/jobs/([^/]+)");
  if (delJob && method === "DELETE") {
    return new Response(null, { status: 204 });
  }

  const reportGet = matchPath(p, "/api/v1/reports/([^/]+)");
  if (reportGet && method === "GET") {
    return json({
      data: {
        jobId: reportGet[1],
        dateRange: {
          start: "2026-01-01T00:00:00Z",
          end: "2026-01-31T23:59:59Z",
        },
        summary: {
          matched: 145,
          unmatched: 3,
          errors: 1,
          accuracy: 98.7,
          totalTransactions: 149,
        },
        matches: [],
        unmatched: [],
        errors: [],
        generatedAt: "2026-01-15T10:00:00Z",
      },
    });
  }

  if (p === "/api/v1/reports" && method === "GET") {
    return json({
      data: [
        {
          jobId: "job_123",
          dateRange: {
            start: "2026-01-01T00:00:00Z",
            end: "2026-01-31T23:59:59Z",
          },
          summary: {
            matched: 145,
            unmatched: 3,
            errors: 1,
            accuracy: 98.7,
            totalTransactions: 149,
          },
          generatedAt: "2026-01-15T10:00:00Z",
        },
      ],
      count: 1,
    });
  }

  if (p === "/api/v1/webhooks" && method === "GET") {
    return json({
      data: [
        {
          id: "wh_123",
          userId: "user_123",
          url: "https://example.com/webhook",
          events: ["reconciliation.matched"],
          secret: "whsec_abc123",
          status: "active",
          createdAt: "2026-01-15T10:00:00Z",
        },
      ],
      count: 1,
    });
  }

  if (p === "/api/v1/webhooks" && method === "POST") {
    const bodyObj = await readJsonBody(init);
    return json(
      {
        data: Object.assign(
          {
            id: "wh_new",
            userId: "user_123",
            secret: "whsec_abc123",
            status: "active",
            createdAt: "2026-01-15T10:00:00Z",
          },
          bodyObj
        ),
        message: "Webhook created successfully",
      },
      201
    );
  }

  const delWh = matchPath(p, "/api/v1/webhooks/([^/]+)");
  if (delWh && method === "DELETE") {
    return new Response(null, { status: 204 });
  }

  if (p === "/api/v1/adapters" && method === "GET") {
    return json({
      data: [
        {
          id: "stripe",
          name: "Stripe",
          description: "Reconcile Stripe payments and charges",
          version: "1.0.0",
          config: {
            required: ["apiKey"],
            optional: ["webhookSecret"],
          },
          supportedEvents: ["payment.succeeded", "charge.refunded"],
        },
        {
          id: "shopify",
          name: "Shopify",
          description: "Reconcile Shopify orders and transactions",
          version: "1.0.0",
          config: {
            required: ["apiKey", "shopDomain"],
            optional: ["webhookSecret"],
          },
          supportedEvents: ["order.created", "order.updated"],
        },
      ],
      count: 2,
    });
  }

  const adapterGet = matchPath(p, "/api/v1/adapters/([^/]+)");
  if (adapterGet && method === "GET") {
    const adapters: Record<string, Record<string, unknown>> = {
      stripe: {
        id: "stripe",
        name: "Stripe",
        description: "Reconcile Stripe payments and charges",
        version: "1.0.0",
        config: {
          required: ["apiKey"],
          optional: ["webhookSecret"],
        },
        supportedEvents: ["payment.succeeded", "charge.refunded"],
      },
      shopify: {
        id: "shopify",
        name: "Shopify",
        description: "Reconcile Shopify orders and transactions",
        version: "1.0.0",
        config: {
          required: ["apiKey", "shopDomain"],
          optional: ["webhookSecret"],
        },
        supportedEvents: ["order.created", "order.updated"],
      },
    };
    const adapterId = adapterGet[1];
    const adapter = adapterId ? adapters[adapterId] : undefined;
    if (!adapter) {
      return json({ error: "Not Found", message: "Adapter not found" }, 404);
    }
    return json({ data: adapter });
  }

  if (p === "/api/v1/error/400" && method === "GET") {
    return json(
      {
        error: "ValidationError",
        message: "Invalid request parameters",
        details: [{ field: "name", message: "Name is required" }],
      },
      400
    );
  }
  if (p === "/api/v1/error/401" && method === "GET") {
    return json({ error: "AuthError", message: "Invalid API key" }, 401);
  }
  if (p === "/api/v1/error/429" && method === "GET") {
    return json({ error: "RateLimitError", message: "Rate limit exceeded" }, 429, {
      "X-RateLimit-Limit": "100",
      "X-RateLimit-Remaining": "0",
      "X-RateLimit-Reset": String(Math.floor(Date.now() / 1000) + 60),
      "Retry-After": "60",
    });
  }
  if (p === "/api/v1/error/500" && method === "GET") {
    return json({ error: "ServerError", message: "Internal server error" }, 500);
  }

  return json({ error: "Not Found", message: `Unhandled mock path ${method} ${p}` }, 404);
}

beforeAll(() => {
  realFetch = globalThis.fetch;
  globalThis.fetch = ((input: string | URL | Request, init?: RequestInit) =>
    handleFetch(input, init)) as typeof fetch;
});

afterAll(() => {
  globalThis.fetch = realFetch;
});
